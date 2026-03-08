import React from "react";
import "../../assets/scss/Shimmer/DocumentShimmer.css";

const DocumentShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th />
          <th />
          <th />
        </tr>
      </thead>

      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "60px" }}>
              {/* No */}
              <td style={{ width: "50px", textAlign: "center" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px", height: "14px", margin: "auto" }}
                />
              </td>

              {/* Title */}
              <td style={{ minWidth: "200px" , paddingRight: "200px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "160px", height: "16px", margin: "auto" }}
                />
              </td>

              {/* Action Buttons */}
              <td style={{ width: "120px", textAlign: "center" , paddingRight: "250px" }}>
                <div
                  className="d-flex justify-content-center"
                  style={{ gap: "10px" }}
                >
                  <div
                    className="skeleton skeleton-icon"
                    style={{ width: "30px", height: "30px", borderRadius: "8px" }}
                  />
                  <div
                    className="skeleton skeleton-icon"
                    style={{ width: "30px", height: "30px", borderRadius: "8px" }}
                  />
                </div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default DocumentShimmer;
