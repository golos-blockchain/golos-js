
import ByteBuffer from 'bytebuffer'
import assert from 'assert'
import base58 from 'bs58'
import {Aes, PrivateKey, PublicKey} from './ecc'
import {ops} from './serializer'

const toPrivateObj = o => (o ? o.d ? o : PrivateKey.fromWif(o) : o/*null or undefined*/)
const toPublicObj = o => (o ? o.Q ? o : PublicKey.fromString(o) : o/*null or undefined*/)

/**
    Decodes messages of format using golos.messages.encode(), which are length-prefixed, and also messages sent by another way (not length-prefixed)
    @arg {string|PrivateKey} private_memo_key - private memo key of "from" or "to"
    @arg {string|PublicKey} second_user_public_memo_key - public memo key of second user
    @arg {object} message_object - object which contains nonce, checksum and encrypted_message (such object returns from private_message API)
    @return {string} - UTF-8 decoded string
*/
export function decode(private_memo_key, second_user_public_memo_key, message_object) {
    assert(private_memo_key, 'private_memo_key is required');
    assert(second_user_public_memo_key, 'second_user_public_memo_key is required');
    assert(message_object, 'message_object is required');

    const privateKey = toPrivateObj(private_memo_key);
    const publicKey = toPublicObj(second_user_public_memo_key);

    let decrypted = Aes.decrypt(privateKey, publicKey,
        message_object.nonce.toString(),
        Buffer.from(message_object.encrypted_message, 'hex'),
        message_object.checksum);

    const mbuf = ByteBuffer.fromBinary(decrypted.toString('binary'), ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    try {
        mbuf.mark()
        decrypted = mbuf.readVString()
    } catch(e) {
        mbuf.reset()
        // Sender did not length-prefix the memo
        decrypted = new Buffer(mbuf.toString('binary'), 'binary').toString('utf-8')
    }

    return decrypted.toString();
}

/**
    Encodes string to send with private_message_operation. Uses writeVString, so format of data to encode is string length + string.
    @arg {string|PrivateKey} from_private_memo_key - private memo key of "from"
    @arg {string|PublicKey} to_public_memo_key - private memo key of "to"
    @arg {string} message - message to encode. Please use JSON string like: '{"app":"golos-id","version":1,"body":"World"}'.
    @return {object} - Object with fields: nonce, checksum and message. To use in operation, nonce should be converted with toString(), and another fields are ready to use.
*/
export function encode(from_private_memo_key, to_public_memo_key, message) {
    assert(from_private_memo_key, 'from_private_memo_key is required');
    assert(to_public_memo_key, 'to_public_memo_key is required');
    assert(message, 'message is required');

    const fromKey = toPrivateObj(from_private_memo_key);
    const toKey = toPublicObj(to_public_memo_key);

    const mbuf = new ByteBuffer(ByteBuffer.DEFAULT_CAPACITY, ByteBuffer.LITTLE_ENDIAN)
    mbuf.writeVString(message);
    message = new Buffer(mbuf.copy(0, mbuf.offset).toBinary(), 'binary');

    let data = Aes.encrypt(fromKey,
        toKey,
        message);
    data.message = data.message.toString('hex');
    return data;
}
