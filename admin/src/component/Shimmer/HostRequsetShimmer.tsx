import React from "react";
import "../../assets/scss/Shimmer/FakeHostShimmer.css";

const HostRequestShimmer = () => {
  return (
    <>
      <thead>
        <tr>
          {/* 9 Columns as per acceptedHostRequestTable */}
          {[
            "No",
            "Agency",
            "Host",
            "User",
            "Impression",
            "Identity Proof",
            "Country",
            "Created At",
            "Info"
          ].map((_, idx) => (
            <th key={idx} scope="col" style={{ height: "50px" }}></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array(8).fill(0).map((_, i) => (
          <tr key={i} style={{ height: "80px" }}>
            {/* No */}
            <td style={{ width: "40px" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* Agency */}
            <td style={{ width: "300px" , paddingLeft: "50px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "80px", height: "10px" }}></div>
                </div>
              </div>
            </td>

            {/* Host */}
            <td style={{ width: "260px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "80px", height: "10px" }}></div>
                </div>
              </div>
            </td>

            {/* User */}
            <td style={{ width: "260px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "80px", height: "10px" }}></div>
                </div>
              </div>
            </td>

            {/* Impression */}
            <td style={{ width: "300px" }}>
              <div>
                <div className="skeleton skeleton-text" style={{ width: "100%", height: "12px", marginBottom: "4px" }}></div>
                {/* <div className="skeleton skeleton-text" style={{ width: "120px", height: "12px" }}></div> */}
              </div>
            </td>

            {/* Identity Proof */}
            <td style={{ width: "120px" }}>
              <div className="skeleton skeleton-text" style={{ width: "80px", height: "12px" }}></div>
            </td>

            {/* Country */}
            <td style={{ width: "160px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "40px", height: "40px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "80px", height: "12px" }}></div>
              </div>
            </td>

            {/* Created At */}
            <td style={{ width: "130px" }}>
              <div className="skeleton skeleton-text" style={{ width: "100px", height: "12px" }}></div>
            </td>

            {/* Info Button */}
            <td style={{ width: "60px" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

export default HostRequestShimmer;
