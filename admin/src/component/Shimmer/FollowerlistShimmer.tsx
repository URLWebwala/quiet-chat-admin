import React from "react";
import "../../assets/scss/Shimmer/FollowerlistShimmer.css";

const FollowerlistShimmer = () => {
  return (
    <>
      {/* Same table head skeleton */}
      <thead>
        <tr>
          {Array(5).fill(0).map((_, idx) => (
            <th key={idx} style={{ height: "50px" }}></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, rowIndex) => (
          <tr key={rowIndex} style={{ height: "70px" }}>
            
            {/* ✅ No */}
            <td style={{ textAlign: "center", width: "50px" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px", height: "16px" }}></div>
            </td>

            {/* ✅ User (Image + Name) */}
            <td style={{ paddingLeft: "135px" }}>
              <div className="d-flex align-items-center gap-2" style={{ width: "200px" }}>
                {/* Profile image */}
                <div
                  className="skeleton skeleton-circle"
                  style={{ width: "50px", height: "50px" }}
                ></div>

                {/* Name */}
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", marginBottom: "4px" }}></div>
                  <div className="skeleton skeleton-text" style={{ width: "60px", height: "12px" }}></div>
                </div>
              </div>
            </td>

            {/* ✅ Unique Id */}
            <td style={{ paddingLeft: "95px" }}>
              <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px" }}></div>
            </td>

            {/* ✅ Country (Flag + Name) */}
            <td>
              <div className="d-flex align-items-center gap-2">
                {/* Flag */}
                <div className="skeleton skeleton-circle" style={{ width: "30px", height: "30px" }}></div>
                {/* Country Name */}
                <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px" }}></div>
              </div>
            </td>

            {/* ✅ Coin (Icon + value) */}
            <td>
              <div className="d-flex align-items-center gap-2">
                {/* Coin icon */}
                <div className="skeleton skeleton-circle" style={{ width: "24px", height: "24px" }}></div>
                {/* Coin value */}
                <div className="skeleton skeleton-text" style={{ width: "40px", height: "14px" }}></div>
              </div>
            </td>

          </tr>
        ))}
      </tbody>
    </>
  );
};

export default FollowerlistShimmer;
