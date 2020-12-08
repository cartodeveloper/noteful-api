const supertest = require("supertest");
const app = require("../src/app");

describe("App", () => {
  it("GET / responds with 200 containing 'Hello this is the noteful api!'", () => {
    return supertest(app).get("/").expect(200);
  });
});
