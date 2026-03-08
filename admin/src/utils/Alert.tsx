import Swal from "sweetalert2";
import { DangerRight } from "../api/toastServices";
import warningImage from "../assets/images/warningImage.png";

export const warning = (confirm: any) => {
  return Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    iconHtml: `<img src=${warningImage.src} style="width: 80px; height: 80px;" alt="Warning">`,
    showCancelButton: true,
    confirmButtonText: confirm,
    customClass: {
      confirmButton: "btn bg-danger text-light m15-right",
      cancelButton: "btn bg-darkGray text-light",
    },
    buttonsStyling: false,
  });
};

export const warningDeclined = (confirm: any) => {
  return Swal.fire({
    title: "Are you sure?",
    text: "Would you like to decline a request?",
    iconHtml: '<i class="ri-alert-line"></i>',
    showCancelButton: true,
    confirmButtonText: confirm,
    customClass: {
      confirmButton: "commonbutton",
      cancelButton: "btn bg-darkGray text-light",
    },
    buttonsStyling: false,
  });
};
export const reqAccepted = (confirm: any) => {
  return Swal.fire({
    title: "Are you sure?",
    text: "Would you like to Accept a request?",
    iconHtml: '<i class="ri-alert-line"></i>',
    showCancelButton: true,
    confirmButtonText: confirm,
    customClass: {
      confirmButton: "btn bg-second text-light m15-right",
      cancelButton: "btn bg-darkGray text-light",
    },
    buttonsStyling: false,
  });
};




export const AgencyAssignToUser = (confirm: any) => {
  return Swal.fire({
    title: "Are you sure?",
    text: "Would you like to Assign Agency to a expert?",
    iconHtml: '<i class="ri-alert-line"></i>',
    showCancelButton: true,
    confirmButtonText: confirm,
    customClass: {
      confirmButton: "btn bg-second text-light m15-right",
      cancelButton: "btn bg-darkGray text-light",
    },
    buttonsStyling: false,
  });
};

export const warningForAccept = (confirm: any) => {
  return Swal.fire({
    title: "Are you sure?",
    text: `You want to accept ${confirm}` ,
    iconHtml: `<img src=${warningImage.src} style="width: 80px; height: 80px;" alt="Warning">`,
    showCancelButton: true,
    confirmButtonText: "Accept",
    customClass: {
      confirmButton: "btn bg-second text-light m15-right",
      cancelButton: "btn bg-darkGray text-light",
    },
    buttonsStyling: false,
  });
};