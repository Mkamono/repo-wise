import axios from "axios";

// Configure axios base URL to use Vite proxy
axios.defaults.baseURL = "/api";

export default axios;
