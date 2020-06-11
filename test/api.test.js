require('babel-polyfill');
import Promise from 'bluebird';
import assert from 'assert';
import makeStub from 'mocha-make-stub'
import should from 'should';

import golos, { Golos } from '../src/api/index';
import config from '../src/config';
import testPost from './test-post.json';

describe.skip('golos.api:', function () {
  this.timeout(30 * 1000);

  describe('new Golos', () => {
    it('doesn\'t open a connection until required', () => {
      assert(!golos.ws, 'There was a connection on the singleton?');
      assert(!new Golos().ws, 'There was a connection on a new instance?');
    });

    it('opens a connection on demand', (done) => {
      const s = new Golos();
      assert(!new Golos().ws, 'There was a connection on a new instance?');
      s.start();
      process.nextTick(() => {
        assert(s.ws, 'There was no connection?');
        done();
      });
    });
  });

  describe('setWebSocket', () => {
    it('works', () => {
      golos.setWebSocket('ws://localhost');
      config.get('websocket').should.be.eql('ws://localhost');
      config.set('websocket', 'wss://api-full.golos.id/ws')
    });
  });

  beforeEach(async () => {
    await golos.apiIdsP;
  });

  describe('getFollowers', () => {
    describe('getting cyberfounder\'s followers', () => {
      it('works', async () => {
        const followersCount = 1;
        const result = await golos.getFollowersAsync('cyberfounder', 0, 'blog', followersCount);
        assert(result, 'getFollowersAsync resoved to null?');
        result.should.have.lengthOf(followersCount);
      });

      it('the startFollower parameter has an impact on the result', async () => {
        const followersCount = 1;
        // Get the first followersCount
        const result1 = await golos.getFollowersAsync('cyberfounder', 0, 'blog', followersCount)
        result1.should.have.lengthOf(followersCount);
        const result2 = await golos.getFollowersAsync('cyberfounder', result1[result1.length - 1].follower, 'blog', followersCount)
        result2.should.have.lengthOf(followersCount);
        result1.should.not.be.eql(result2);
      });

      it('clears listeners', async () => {
        golos.listeners('message').should.have.lengthOf(0);
      });
    });
  });

  describe('getContent', () => {
    describe('getting a random post', () => {
      it('works', async () => {
        const result = await golos.getContentAsync('pal', '2scmtp-test');
        result.should.have.properties(testPost);
      });

      it('clears listeners', async () => {
        golos.listeners('message').should.have.lengthOf(0);
      });
    });
  });

  describe('streamBlockNumber', () => {
    it('streams golos transactions', (done) => {
      let i = 0;
      const release = golos.streamBlockNumber((err, block) => {
        should.exist(block);
        block.should.be.instanceOf(Number);
        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamBlock', () => {
    it('streams golos blocks', (done) => {
      let i = 0;
      const release = golos.streamBlock((err, block) => {
        try {
          should.exist(block);
          block.should.have.properties([
            'previous',
            'transactions',
            'timestamp',
          ]);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamTransactions', () => {
    it('streams golos transactions', (done) => {
      let i = 0;
      const release = golos.streamTransactions((err, transaction) => {
        try {
          should.exist(transaction);
          transaction.should.have.properties([
            'ref_block_num',
            'operations',
            'extensions',
          ]);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('streamOperations', () => {
    it('streams golos operations', (done) => {
      let i = 0;
      const release = golos.streamOperations((err, operation) => {
        try {
          should.exist(operation);
        } catch (err) {
          release();
          done(err);
          return;
        }

        i++;
        if (i === 2) {
          release();
          done();
        }
      });
    });
  });

  describe('when there are network failures (the ws closes)', () => {
    const originalStart = Golos.prototype.start;
    makeStub(Golos.prototype, 'start', function () {
      return originalStart.apply(this, arguments);
    });

    const originalStop = Golos.prototype.stop;
    makeStub(Golos.prototype, 'stop', function () {
      return originalStop.apply(this, arguments);
    });

    it('tries to reconnect automatically', async () => {
      const golos = new Golos();
      // console.log('RECONNECT TEST start');
      assert(!golos.ws, 'There was a websocket connection before a call?');
      // console.log('RECONNECT TEST make followers call');
      const followersCount = 1;
      await golos.getFollowersAsync('cyberfounder', 0, 'blog', followersCount);
      assert(golos.ws, 'There was no websocket connection after a call?');
      // console.log('RECONNECT TEST wait 1s');
      await Promise.delay(1000);
      // console.log('RECONNECT TEST simulate close event');
      assert(!golos.stop.calledOnce, 'Golos::stop was already called before disconnect?');
      golos.ws.emit('close');
      assert(!golos.ws);
      assert(!golos.startP);
      assert(golos.stop.calledOnce, 'Golos::stop wasn\'t called when the connection closed?');
      // console.log('RECONNECT TEST make followers call');
      await golos.getFollowersAsync('cyberfounder', 0, 'blog', followersCount);
      assert(golos.ws, 'There was no websocket connection after a call?');
      assert(golos.isOpen, 'There was no websocket connection after a call?');
    });
  });
});
