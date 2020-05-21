const gremlin = require("gremlin");
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

const CONNECTION_URL = "ws://localhost";
// const CONNECTION_URL = "wss://neptuneuser.cluster-ro-ci3zmdetv04v.us-east-1.neptune.amazonaws.com";
const CONNECTION_PORT = "8182";
const dc = new DriverRemoteConnection(CONNECTION_URL + ":" + CONNECTION_PORT + "/gremlin", {});
const g = traversal().withRemote(dc);

module.exports = {
  g,
  /*
    INPUT:
        Label = Similar to tableName
        data = as Object
    EXAMPLE INPUT:
        (user,{_id:123,...})
                */
  insert: async (Label, data) => {
    try {
      if (!data._id) {
        throw new Error("No _id available");
      }
      const isUserAvailable = await g
        .V()
        .has("_id", data._id)
        .toList();

      if (isUserAvailable.length != 0) {
        // throw new Error(`_id:${data._id} is already used`);
        console.error(`_id: ${data._id} is already used`);
        return;
      }
      // create a EMPTY vertex of label as Table value
      // addV(LABEL NAME)
      let insertedItem = g.addV(Label);
      for (let key in data) {
        insertedItem = insertedItem.property(key, data[key]);
      }
      insertedItem = await insertedItem.toList()
      // let insertedId = await g.addV(Label).toList();
      // // Retrieve graph id
      // insertedId = insertedId[0].id.toString();
      // for (let key in data) {
      //   insertedItem = await g
      //     .V(insertedId)
      //     .property(key, data[key]).property().property()
      //     .valueMap()
      //     .toList();
      // }

      console.log(insertedItem, "Insertion Successfully");
      return insertedItem;
    } catch (error) {
      console.warn(error);
      return false;
    }
  },
  createEdge: async (id1, id2, Label) => {
    try {
      if (!id1 && !id2 && !Label) {
        throw new Error("Invalid arguments");
      }
      let insertionCheck = await g
        .V()
        .has("_id", id1)
        .out(Label)
        .dedup()
        .has("_id", id2)
        .toList();
      if (insertionCheck.length != 0) {
        return true;
      }
      let v1 = await g
        .V()
        .has("_id", id1)
        .toList();
      v1 = (v1[0] && v1[0].id.toString()) || false;
      if (!v1) {
        throw new Error(`${id1} not found`);
      }
      let v2 = await g
        .V()
        .has("_id", id2)
        .toList();
      v2 = (v2[0] && v2[0].id.toString()) || false;
      if (!v2) {
        throw new Error(`${id2} not found`);
      }
      const createdEdge = await g
        .V(v1)
        .addE(Label)
        .to(g.V(v2))
        .toList();
      console.log(createdEdge, "Edge created");
    } catch (error) {
      console.warn(error);
      return false;
    }
  },
  findVertex: async (Label = false) => {
    let query = g.V();
    if (Label) {
      query = query.hasLabel(Label);
    }
    return await query.valueMap().toList();
  }
};
