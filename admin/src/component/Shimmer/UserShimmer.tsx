import React from "react";
import "../../assets/scss/Shimmer/UserShimmer.css";

const UserShimmer = () => {
  return (
    <>
      <thead>
        <tr>
          {[...Array(16)].map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array(10).fill(0).map((_, i) => (
          <tr key={i}>
            {/* No */}
            <td><div className="skeleton skeleton-text" style={{ width: "20px", height: "20px", margin: "auto" }} /></td>

            {/* User */}
            <td>
              <div className="d-flex px-2 py-1" style={{ width: "250px", gap: "10px" }}>
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }} />
                <div className="d-flex flex-column justify-content-center text-start">
                  <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px", marginBottom: "4px" }} />
                  <div className="skeleton skeleton-text" style={{ width: "60px", height: "12px" }} />
                </div>
              </div>
            </td>

            {/* Email */}
            <td><div className="skeleton skeleton-text" style={{ width: "140px", height: "14px", margin: "auto" }} /></td>

            {/* Country */}
            <td>
              <div className="d-flex justify-content-end align-items-center gap-3">
                <div style={{ width: "70px", textAlign: "end" }}>
                  <div className="skeleton skeleton-circle" style={{ width: "40px", height: "40px", marginLeft: "auto" }} />
                </div>
                <div style={{ width: "100px", textAlign: "start" }}>
                  <div className="skeleton skeleton-text" style={{ width: "70px", height: "14px" }} />
                </div>
              </div>
            </td>

            {/* Coin */}
            <td>
              <div className="d-flex justify-content-center align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "25px", height: "25px" }} />
                <div className="skeleton skeleton-text" style={{ width: "50px", height: "14px"  }} />
              </div>
            </td>

            {/* Recharge Coin */}
            <td><div className="skeleton skeleton-text" style={{ width: "20px", height: "14px", margin: "auto" }} /></td>

            {/* Following */}
            <td><div className="skeleton skeleton-text" style={{ width: "20px", height: "14px", margin: "auto" }} /></td>

            {/* Online Status */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px", height: "14px", margin: "auto" }} /></td>

            {/* Host Status */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px", height: "14px", margin: "auto" }} /></td>

            {/* Vip Status */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px", height: "14px", margin: "auto" }} /></td>

            {/* Created At */}
            <td><div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", margin: "auto" }} /></td>

            {/* IsBlock */}
            <td><div className="skeleton skeleton-pill" style={{ width: "50px", height: "25px", margin: "auto" }} /></td>

            {/* Info */}
            <td><div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "10px", margin: "auto" }} /></td>

            {/* Notification */}
            <td><div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "12px", margin: "auto" }} /></td>

            {/* History */}
            <td><div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "10px", margin: "auto" }} /></td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

export default UserShimmer;
