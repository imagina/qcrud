import axios from 'axios'

class ApiResponse {
  handleError(error, callback) {
    //Instance the bext indicator
    let next = true
    //Validate if the error iss axios canceled
    if (axios.isCancel(error)) next = false
    //Call back
    if (next) callback();
  }
}

const apiResponse = new ApiResponse();

export default apiResponse;

export {apiResponse}
