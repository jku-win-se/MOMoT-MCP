# momot-engine-client

A lightweight, isomorphic TypeScript/JavaScript client for the MOMoT evolutionary engine REST service.

## Browser and WebWorker Support

This package is fully isomorphic and does not require Node.js-specific APIs:
- It uses standard `fetch` for network requests.
- It uses `TextEncoder` and `TextDecoder` for encoding/decoding text payloads and result outputs.
- It leverages `JSZip` in an isomorphic manner (generating `uint8array` instead of Node-only buffers).

This allows the client to run seamlessly in browsers, WebWorkers, Cloud IDE extension host processes (like Theia/EMF.cloud), and Node.js environments.
