declare module "jsmediatags" {
  interface PictureData {
    format: string
    data: Uint8Array
    description?: string
  }

  interface TagData {
    title?: string
    artist?: string
    album?: string
    year?: string
    comment?: string | { text?: string }
    track?: string
    genre?: string
    picture?: PictureData
    lyrics?: string
    composer?: string
    TPE1?: { data: string }
    TPE2?: { data: string }
    TPOS?: { data: string }
    TCOM?: { data: string }
    USLT?: { data: string }
    [key: string]: any
  }

  interface ReadResult {
    type: string
    tags: TagData
  }

  interface ReadError {
    type: string
    info: string
  }

  interface ReaderCallbacks {
    onSuccess: (tag: ReadResult) => void
    onError: (error: ReadError) => void
  }

  function read(
    source: string | ArrayBuffer | import("node:buffer").Buffer | Uint8Array,
    callbacks: ReaderCallbacks
  ): void

  export = { read }
}
