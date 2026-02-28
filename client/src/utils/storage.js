export const saveUser = (user) => {
  const users = JSON.parse(localStorage.getItem("users") || "[]");

  // Avoid duplicates
  if (user.role === "user") {
    const exists = users.some((u) => u.email === user.email);
    if (exists) throw new Error("User already exists");
  }

  // Map yes/no → boolean
  if (user.role === "user") {
    user.d1 = user.parkinsons === "yes";
    user.d2 = user.dementia === "yes";
  }

  users.push(user);
  localStorage.setItem("users", JSON.stringify(users));
};

export const getUsers = () => {
  return JSON.parse(localStorage.getItem("users") || "[]");
};

export const clearStorage = () => {
  localStorage.clear();
};
