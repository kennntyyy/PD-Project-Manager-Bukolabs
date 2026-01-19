const axios = require("axios");

async function testLogin() {
  console.log("Testing with plain passwords...\n");

  const testUsers = [
    { username: "admin", password: "admin123" },
    { username: "staff", password: "staff123" },
    { username: "client", password: "client123" },
    { username: "contractor", password: "contractor123" },
  ];

  for (const user of testUsers) {
    try {
      console.log(`Testing: ${user.username}/${user.password}`);

      const response = await axios.post(
        "http://localhost:3000/api/auth/login",
        {
          username: user.username,
          password: user.password,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      console.log(`✅ Success! Role: ${response.data.user.user_role}\n`);
    } catch (error) {
      console.log(
        `❌ Failed: ${error.response?.data?.message || error.message}\n`,
      );
    }
  }
}

testLogin();
