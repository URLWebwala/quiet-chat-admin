import React from "react";
import "../../assets/scss/Shimmer/HostShimmer.css";

const HostShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(18).fill(0).map((_, idx) => (
            <th key={idx} scope="col"></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array(8).fill(0).map((_, i) => (
          <tr key={i} style={{ height: "80px" }}>
            {/* No */}
            <td style={{ paddingLeft: "25px" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* Agency */}
            <td style={{ paddingLeft: "35px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "55px", height: "55px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
                </div>
              </div>
            </td>

            {/* Host */}
            <td style={{ paddingLeft: "25px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "55px", height: "55px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
                </div>
              </div>
            </td>

            {/* User */}
            <td style={{ paddingLeft: "25px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "55px", height: "55px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
                </div>
              </div>
            </td>

            {/* Country */}
            <td style={{ paddingLeft: "25px" }}>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "40px", height: "40px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
              </div>
            </td>

            {/* Followers */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px" }}></div></td>

            {/* Gender */}
            <td><div className="skeleton skeleton-text" style={{ width: "40px" }}></div></td>

            {/* Identity Proof Type */}
            <td><div className="skeleton skeleton-text" style={{ width: "60px" }}></div></td>

            {/* Impression */}
            <td>
              <div className="d-flex flex-column gap-1">
                <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
                <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
              </div>
            </td>

            {/* Coin */}
            <td><div className="skeleton skeleton-text" style={{ width: "60px" }}></div></td>

            {/* IsOnline */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px" }}></div></td>

            {/* IsBusy */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px" }}></div></td>

            {/* IsLive */}
            <td><div className="skeleton skeleton-text" style={{ width: "30px" }}></div></td>

            {/* Created At */}
            <td><div className="skeleton skeleton-text" style={{ width: "100px" }}></div></td>

            {/* IsBlock Toggle */}
            <td><div className="skeleton skeleton-pill" style={{ width: "50px", height: "25px" }}></div></td>

            {/* Info Button */}
            <td><div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div></td>

            {/* Notification Button */}
            <td><div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div></td>

            {/* History Button */}
            <td><div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div></td>
          </tr>
        ))}
      </tbody>
    </>
  );
};

export default HostShimmer;
