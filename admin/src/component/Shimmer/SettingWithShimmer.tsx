import React from "react";
import "../../assets/scss/Shimmer/SettingWithShimmer.css";

const SettingWithShimmer = () => {
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
        </tr>
      </thead>

      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "70px" }}>
              {/* No */}
              <td style={{ width: "50px", textAlign: "center" }}>
                <div className="skeleton skeleton-text" style={{ width: "20px", height: "14px", margin: "auto" }} />
              </td>

              {/* Image */}
              <td style={{ width: "80px", textAlign: "center" , paddingLeft: "70px" }}>
                <div className="skeleton skeleton-circle" style={{ width: "60px", height: "60px", margin: "auto" }} />
              </td>

              {/* Name */}
              <td style={{ minWidth: "150px" , paddingLeft: "150px" }}>
                <div className="skeleton skeleton-text" style={{ width: "120px", height: "16px", margin: "auto" }} />
              </td>

              {/* Details (list) */}
              <td style={{ minWidth: "220px" , paddingLeft: "150px" }}>
                <div className="skeleton skeleton-text" style={{ width: "140px", height: "12px", marginBottom: "6px" }} />
                {/* <div className="skeleton skeleton-text" style={{ width: "160px", height: "12px" }} /> */}
              </td>

              {/* Created Date */}
              <td style={{ minWidth: "140px" , paddingRight: "170px" }}>
                <div className="skeleton skeleton-text" style={{ width: "100px", height: "14px", margin: "auto" }} />
              </td>

              {/* IsActive Toggle */}
              <td style={{ width: "80px", textAlign: "center" , paddingRight: "120px" }}>
                <div className="skeleton skeleton-toggle" style={{ width: "40px", height: "20px", borderRadius: "12px", margin: "auto" }} />
              </td>

              {/* Action Buttons (Edit + Delete) */}
              <td style={{ width: "120px", textAlign: "center" }}>
                <div className="d-flex justify-content-center" style={{ gap: "10px" }}>
                  <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }} />
                  <div className="skeleton skeleton-icon" style={{ width: "30px", height: "30px", borderRadius: "8px" }} />
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default SettingWithShimmer;
