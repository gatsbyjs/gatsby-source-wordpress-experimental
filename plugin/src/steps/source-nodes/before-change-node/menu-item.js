import atob from "atob"

export function beforeChangeMenuItem(api) {
  const { remoteNode } = api

  const decodedId = atob(remoteNode.id)

  // this MenuItem has an incorrect ID.
  // this is a WPGQL bug that will be fixed soon.
  if (decodedId.includes(`post`)) {
    return {
      // for now discard this node
      cancelUpdate: true,
    }
  }
}
