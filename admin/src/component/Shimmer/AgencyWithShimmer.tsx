import React from "react";
import "../../assets/scss/Shimmer/WithdrawerShimmer.css";

const WithdrawerShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
          <th />
        </tr>
      </thead>

      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "70px" }}>
              {/* No */}
              <td style={{ width: "40px", textAlign: "center" }}>
                <div className="skeleton skeleton-text" style={{ width: "20px", height: "14px", margin: "auto" }} />
              </td>

              {/* Unique ID */}
              <td style={{ minWidth: "100px" }}>
                <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px", margin: "auto" }} />
              </td>

              {/* Agency (Image + Name) */}
              <td style={{ minWidth: "280px" , paddingLeft: "100px" }}>
                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                  <div className="skeleton skeleton-circle" style={{ width: "60px", height: "60px" }} />
                  <div>
                    <div className="skeleton skeleton-text" style={{ width: "120px", height: "16px", marginBottom: "6px" }} />
                  </div>
                </div>
              </td>

              {/* Coin (Icon + Value) */}
              <td style={{ minWidth: "120px" }}>
                <div className="d-flex align-items-center" style={{ gap: "10px" }}>
                  <div className="skeleton" style={{ width: "25px", height: "25px", borderRadius: "50%" }} />
                  <div className="skeleton skeleton-text" style={{ width: "50px", height: "14px" }} />
                </div>
              </td>

              {/* Amount */}
              <td style={{ minWidth: "80px" }}>
                <div className="skeleton skeleton-text" style={{ width: "60px", height: "14px", margin: "auto" }} />
              </td>

              {/* Date */}
              <td style={{ minWidth: "100px" }}>
                <div className="skeleton skeleton-text" style={{ width: "80px", height: "14px", margin: "auto" }} />
              </td>

              {/* Info Button */}
              <td style={{ width: "80px", textAlign: "center" }}>
                <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
              </td>

              {/* Accepted Button */}
              <td style={{ width: "80px", textAlign: "center" }}>
                <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }} />
              </td>

              {/* Declined Button */}
              <td style={{ width: "80px", textAlign: "center" }}>
                <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }} />
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default WithdrawerShimmer;