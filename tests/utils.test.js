const expect = require("expect");
const { guid, validURL } = require("../functions");


  test("Should return true for valid URL", () => {
    let string = validURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(string).toBeTruthy();
  });

  test("Should return false for invalid URL", () => {
    let string = validURL("dQw4w9WgXcQ");
    expect(string).toBeFalsy();
  });

  test("Should return a guid of 36 characters", () => {
    let uuid = guid();
    expect(uuid).toHaveLength(36);
  });
