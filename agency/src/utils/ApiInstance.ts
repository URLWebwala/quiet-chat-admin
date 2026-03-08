import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { baseURL, key } from "./config";
import { setToast } from "./toastServices";
import { createSelector } from "reselect";

const selectStates = (state: any) => state;

export const isLoading = createSelector(selectStates, (state) => {
  const slices = Object.values(state);
  const loading = slices.some((slice: any) => {
    if (
      typeof slice === "object" &&
      slice !== null &&
      slice.isLoading === true
    ) {
      return true;
    }
    return false;
  });
  return loading;
});

interface ApiResponseError {
  message: string | string[];
  code?: string;
}

const getTokenData = (): string | null => {
  if (typeof sessionStorage !== "undefined") {
    return sessionStorage.getItem("token");
  }
  return null;
};

export const apiInstance: AxiosInstance = axios.create({
  baseURL,
  headers: {
    key,
    "Content-Type": "application/json",

  },
});

const cancelTokenSource = axios.CancelToken.source();
const token: string | null = getTokenData();
apiInstance.defaults.headers.common["Authorization"] = token ? `Bearer ${token}` : "";
apiInstance.defaults.headers.common["key"] = key;

apiInstance.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    config.cancelToken = cancelTokenSource.token;
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error);
  }
);

apiInstance.interceptors.response.use(
  (response: AxiosResponse): any => response.data,
  (error: AxiosError): Promise<void> => {
    const errorData = error.response?.data as any;

    if (!errorData) {
      setToast("error", "An unexpected error occurred.");
      return Promise.reject(error);
    }

    if (!errorData.message) {
      setToast("error", "Something went wrong!");
    }

    // if(errorData.error === "jwt expired"){
    //   window.location.href = "/"
    // }

    if (
      errorData.code === "E_USER_NOT_FOUND" ||
      errorData.code === "E_UNAUTHORIZED"
    ) {
      window && localStorage.clear();
      window.location.reload();
    }

    if (typeof errorData.message === "string") {
      setToast("error", errorData.message);
    } else if (Array.isArray(errorData.message)) {
      errorData.message.forEach((msg: string) => setToast("error", msg));
    }
    return Promise.reject(error);
  }
);

const handleErrors = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const data = await response.json();
    if (Array.isArray(data.message)) {
      data.message.forEach((msg: string) => console.log("msg", msg));
    } else {
      console.log("data.message", data.message);
    }

    if (response.status === 401 ) {
      console.warn("User session expired. Logging out...");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("admin");
      sessionStorage.removeItem("key");
      window.location.href = "/"; // Redirect to login page
    }


    if (data.code === "E_USER_NOT_FOUND" || data.code === "E_UNAUTHORIZED") {
      // Handling authentication errors more gracefully
    }
    
    return Promise.reject(data);
  }

  return response.json();
};

const getHeaders = (isFormData = false): { [key: string]: string } => {
  const token = getTokenData(); // ✅ Get the token only once
  let headers: { [key: string]: string } = {
    key,
    Authorization: token ? `Bearer ${token}` : "",
    "x-agency-uid": sessionStorage.getItem("uid") || "",
  };

  // ✅ Only add "Content-Type" if NOT FormData
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

export const apiInstanceFetch: any = {
  get: (url: string) =>
    fetch(`${baseURL}${url}`, {
      method: "GET",
      headers: getHeaders(),
    }).then(handleErrors),

  post: (url: string, data: object | FormData) =>
    fetch(`${baseURL}${url}`, {
      method: "POST",
      headers: data instanceof FormData ? getHeaders(true) : getHeaders(),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }).then(handleErrors),

  patch: (url: string, data: object | FormData) =>
    fetch(`${baseURL}${url}`, {
      method: "PATCH",
      headers: data instanceof FormData ? getHeaders(true) : getHeaders(),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }).then(handleErrors),

  put: (url: string, data: object | FormData) =>
    fetch(`${baseURL}${url}`, {
      method: "PUT",
      headers: data instanceof FormData ? getHeaders(true) : getHeaders(),
      body: data instanceof FormData ? data : JSON.stringify(data),
    }).then(handleErrors),

  delete: (url: string) =>
    fetch(`${baseURL}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleErrors),
};


