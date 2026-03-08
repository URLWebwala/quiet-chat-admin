import React from "react";
import "../../assets/shimmer/WithdrawPendingShimmer.css";

const WithdrawPendingShimmer = () => {
  return (
    <>
      {/* Table header shimmer */}
      <thead>
        <tr style={{ height: "50px" }}>
          {Array(9).fill(0).map((_, idx) => (
            <th key={idx}></th>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array(8).fill(0).map((_, rowIdx) => (
          <tr key={rowIdx} style={{ height: "80px" }}>
            
            {/* No */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-text" style={{ width: "20px" }}></div>
            </td>

            {/* UniqueId */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "100px" }}></div>
            </td>

            {/* Host (Image + Name) */}
            <td>
              <div className="d-flex align-items-center gap-2">
                <div className="skeleton skeleton-circle" style={{ width: "50px", height: "50px" }}></div>
                <div>
                  <div className="skeleton skeleton-text" style={{ width: "120px", marginBottom: "6px" }}></div>
                </div>
              </div>
            </td>

            {/* Coin */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "50px" }}></div>
            </td>

            {/* Amount */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "60px" }}></div>
            </td>

            {/* Created At */}
            <td>
              <div className="skeleton skeleton-text" style={{ width: "140px" }}></div>
            </td>

            {/* Info button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

            {/* Accepted button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

            {/* Declined button */}
            <td style={{ textAlign: "center" }}>
              <div className="skeleton skeleton-icon" style={{ width: "28px", height: "28px" }}></div>
            </td>

          </tr>
        ))}
      </tbody>
    </>
  );
};

export default WithdrawPendingShimmer;
