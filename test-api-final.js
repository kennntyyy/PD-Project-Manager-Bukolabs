const axios = require("axios");

const API_URL = "http://localhost:3000/api";

// Store token
let TOKEN = "";

async function testAPI() {
  try {
    console.log("[TEST] 🚀 Starting comprehensive API tests...\n");

    // Test 1: Login
    console.log("[TEST] 1️⃣  Testing LOGIN...");
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      username: "admin",
      password: "admin123",
    });
    TOKEN = loginResponse.data.access_token;
    console.log("[TEST] ✅ Login successful\n");

    // Create axios instance with token
    const api = axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    // Test 2: Get all users
    console.log("[TEST] 2️⃣  Testing GET /users (list all)...");
    const getAllResponse = await api.get("/users");
    console.log(
      "[TEST] ✅ GET /users successful, found",
      getAllResponse.data.length,
      "users\n",
    );

    // Test 3: Create a new user
    console.log("[TEST] 3️⃣  Testing POST /users (CREATE)...");
    const uniqueId = Date.now();
    const createPayload = {
      username: "testuser_" + uniqueId,
      email: "test_" + uniqueId + "@example.com",
      password: "TestPass123!",
      first_name: "Test",
      last_name: "User",
      phone: "1234567890",
      user_role: "staff",
    };
    console.log("[TEST] Payload:", JSON.stringify(createPayload, null, 2));

    try {
      const createResponse = await api.post("/users", createPayload);
      const newUserId = createResponse.data.user_id;
      console.log(
        "[TEST] ✅ POST /users successful, created user ID:",
        newUserId,
        "\n",
      );

      // Test 4: Get specific user
      console.log("[TEST] 4️⃣  Testing GET /users/:id...");
      const getOneResponse = await api.get(`/users/${newUserId}`);
      console.log("[TEST] ✅ GET /users/:id successful\n");

      // Test 5: Update user
      console.log("[TEST] 5️⃣  Testing PUT /users/:id (UPDATE)...");
      const updatePayload = {
        email: "updated_" + uniqueId + "@example.com",
        first_name: "Updated",
        last_name: "Name",
      };
      console.log(
        "[TEST] Update Payload:",
        JSON.stringify(updatePayload, null, 2),
      );

      const updateResponse = await api.put(
        `/users/${newUserId}`,
        updatePayload,
      );
      console.log("[TEST] ✅ PUT /users/:id successful\n");

      // Test 6: Change password
      console.log("[TEST] 6️⃣  Testing POST /users/:id/change-password...");
      const changePassPayload = {
        current_password: "TestPass123!",
        new_password: "NewPass456!",
      };
      const changePassResponse = await api.post(
        `/users/${newUserId}/change-password`,
        changePassPayload,
      );
      console.log("[TEST] ✅ POST /users/:id/change-password successful\n");

      // Test 7: Change role
      console.log("[TEST] 7️⃣  Testing PUT /users/:id/change-role...");
      const changeRolePayload = {
        role: "client",
      };
      const changeRoleResponse = await api.put(
        `/users/${newUserId}/change-role`,
        changeRolePayload,
      );
      console.log("[TEST] ✅ PUT /users/:id/change-role successful\n");

      // Test 8: Toggle active
      console.log("[TEST] 8️⃣  Testing PUT /users/:id/toggle-active...");
      const toggleResponse = await api.put(`/users/${newUserId}/toggle-active`);
      console.log("[TEST] ✅ PUT /users/:id/toggle-active successful\n");

      // Test 9: Delete user
      console.log("[TEST] 9️⃣  Testing DELETE /users/:id...");
      await api.delete(`/users/${newUserId}`);
      console.log("[TEST] ✅ DELETE /users/:id successful\n");

      console.log("[TEST] 🎉 ALL TESTS PASSED!\n");
    } catch (createError) {
      console.error(
        "[TEST] ❌ Error:",
        createError.response?.status,
        createError.response?.statusText,
      );
      console.error("[TEST] Error data:", createError.response?.data);
      console.error("[TEST] Error message:", createError.message);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      "[TEST] ❌ ERROR:",
      error.response?.status,
      error.response?.statusText,
    );
    console.error("[TEST] Error data:", error.response?.data);
    console.error("[TEST] Error message:", error.message);
    process.exit(1);
  }
}

testAPI();
