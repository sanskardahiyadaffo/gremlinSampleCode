const graph = require("./basic_Functions");

const { g } = graph;
const userTable = "users";
const InsertSampleData = async () => {
  for (let i = 5; i <= 10; i++) {
    await graph.insert(userTable, {
      _id: i,
      name: String.fromCharCode(64 + i)
    });
  }
};
const createLinks = async () => {};
(async () => {
  console.log("Start\n\n");
    // await InsertSampleData();
  //   await createLinks()
  const res = await g
    .V()
    .hasLabel(userTable)
    .valueMap()
    .toList();
  console.log(res, "<");

  console.log("\n\nEND");
})();
