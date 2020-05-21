const gremlin = require("gremlin");
const traversal = gremlin.process.AnonymousTraversalSource.traversal;
const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

const CONNECTION_URL = "ws://localhost";
// const CONNECTION_URL = "wss://neptuneuser.cluster-ro-ci3zmdetv04v.us-east-1.neptune.amazonaws.com";
const CONNECTION_PORT = "8182";
const dc = new DriverRemoteConnection(CONNECTION_URL + ":" + CONNECTION_PORT + "/gremlin", {});
const g = traversal().withRemote(dc);

/*
 INPUT:
    Label = Similar to tableName
    data = as Object 
  EXAMPLE INPUT:
      (user,{_id:123,...})
*/
const InsertData = async (Label, data) => {
  try {
    if (!data._id) {
      throw new Error("No _id available");
    }

    const isUserAvailable = await g
      .V()
      .has("_id", data._id)
      .toList();

    if (isUserAvailable.length != 0) {
      throw new Error(`_id:${data._id} is already used`);
    }

    // create a EMPTY vertex of label as Table value
    // addV(LABEL NAME)
    let insertedId = await g.addV(Label).toList();
    // Retrieve graph id
    insertedId = insertedId[0].id.toString();
    let insertedItem = false;
    for (let key in data) {
      insertedItem = await g
        .V(insertedId)
        .property(key, data[key])
        .properties()
        .toList();
    }
    console.log(insertedItem, "Insertion Successfully");
    return insertedItem;
  } catch (error) {
    console.warn(error);
    return false;
  }
};

// INPUT: 2 userId's not graphID and their relation as Label
const createEdge = async (id1, id2, Label) => {
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
};

// INPUT: userId not graphID
const findSuggestions = async id => {
  try {
    if (!id) {
      throw new Error("No id is given");
    }

    let FOF = await g
      .V()
      .has("_id", id)
      .both("friend")
      .both("friend")
      .dedup()
      .valueMap("name", "_id")
      .toList();

    console.log(FOF, "FOFF>>");

    return FOF;
  } catch (error) {
    console.warn(error);
    return false;
  }
};

const loadSampleData = async () => {
  const USERS = [
    {
      _id: 1,
      name: "user1",
      state: "HR",
      age: "20"
    },
    {
      _id: 2,
      name: "user2",
      state: "KN",
      age: "21"
    },
    {
      _id: 3,
      name: "user3",
      state: "HP",
      age: "22"
    },
    {
      _id: 4,
      name: "user4",
      state: "HR",
      age: "19"
    },
    {
      _id: 5,
      name: "user5",
      state: "GN",
      age: "20"
    },
    {
      _id: 6,
      name: "user6",
      state: "HR",
      age: "21"
    }
  ];
  for (const user of USERS) {
    await InsertData("user", user);
  }
};
const mainFunction = async event => {
  let response = {};

  let z = "Start              ";
  try {
    // await loadSampleData();
    z += "Sample Data Loaded               ";
    await createEdge(1, 2, "friend");
    // await createEdge(1, 4, "friend");
    // await createEdge(2, 3, "friend");
    // await createEdge(3, 6, "friend");
    // await createEdge(4, 3, "friend");
    // await createEdge(4, 5, "friend");
    z += "Edge created             ";

    let ans = await findSuggestions(1);
    ans = { ...ans };
    console.log(ans, "<<final answer");
    //   z = z + ans;
    response = {
      statusCode: 200,
      body: JSON.stringify({ z, ans })
    };
  } catch (error) {
    console.erro(error);
    response = {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }

  return response;
};
mainFunction();
exports.handler = mainFunction;
