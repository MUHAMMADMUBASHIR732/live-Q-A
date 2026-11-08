// Call this only in the browser (inside event handlers or useEffect).
export function getVoterToken() {
  let token = localStorage.getItem("voterToken");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("voterToken", token);
  }
  return token;
}
