/* oxlint-disable anti-slop/no-runtime-typeof -- test stub mirrors expo-file-system's polymorphic string-or-parent constructor */
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"

const ensureParentDir = (uri: string) => {
  fs.mkdirSync(path.dirname(uri), { recursive: true })
}

export class File {
  uri: string

  constructor(parentOrUri: string | { uri: string }, name?: string) {
    const root = typeof parentOrUri === "string" ? parentOrUri : parentOrUri.uri
    this.uri = name === undefined ? root : path.join(root, name)
  }

  get exists() {
    return fs.existsSync(this.uri)
  }

  async write(content: string): Promise<void> {
    ensureParentDir(this.uri)
    await fs.promises.writeFile(this.uri, content, "utf8")
  }

  async text(): Promise<string> {
    return fs.promises.readFile(this.uri, "utf8")
  }
}

export class Directory {
  uri: string

  constructor(uri: string) {
    this.uri = uri
  }

  createFile(name: string): File {
    return new File(this.uri, name)
  }
}

export const Paths = {
  cache: path.join(os.tmpdir(), "startune-test-cache"),
  document: path.join(os.tmpdir(), "startune-test-documents"),
}
