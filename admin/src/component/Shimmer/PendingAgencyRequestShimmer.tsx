import React from "react";
import "../../assets/scss/Shimmer/PendingAgencyRequestShimmer.css";

const PendingAgencyRequestShimmer = () => {
  return (
    <>
      <thead>
        <tr style={{ height: "50px" }}>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
          <th scope="col"></th>
        </tr>
      </thead>
      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
            <tr key={i} style={{ height: "80px" }}>
              {/* No */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "20px" }} />
              </td>

              {/* Agency */}
              <td>
                <div className="d-flex justify-content-center px-2 py-1" style={{ width: "250px" }}>
                  <div>
                    <div
                      className="skeleton skeleton-circle"
                      style={{
                        height: "50px",
                        width: "50px",
                        borderRadius: "50px",
                      }}
                    />
                  </div>
                  <div className="d-flex flex-column justify-content-center text-start ms-3">
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        height: "14px",
                        width: "100px",
                        marginBottom: "5px",
                      }}
                    />
                    <div
                      className="skeleton skeleton-text"
                      style={{ height: "12px", width: "80px" }}
                    />
                  </div>
                </div>
              </td>

              {/* Country */}
              <td className="" style={{paddingRight : "200px"}}>
                <div className="d-flex justify-content-end align-items-center gap-3">
                  <div style={{ width: "70px", textAlign: "end" }}>
                    <div
                      className="skeleton skeleton-circle"
                      style={{
                        height: "40px",
                        width: "40px",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                  <div style={{ width: "100px", textAlign: "start" }}>
                    <div className="skeleton skeleton-text" style={{ width: "70px" }} />
                  </div>
                </div>
              </td>

              {/* Total Earning */}
              <td style={{paddingRight : "100px"}}>
                <div className="skeleton skeleton-text" style={{ width: "80px" }} />
              </td>

              {/* Commission */}
              <td style={{paddingRight : "80px"}}>
                <div className="skeleton skeleton-text" style={{ width: "50px" }} />
              </td>

              {/* No Of Host */}
              <td style={{paddingRight : "80px"}}>
                <div className="skeleton skeleton-text" style={{ width: "40px" }} />
              </td>

              {/* Date */}
              <td style={{paddingRight : "50px"}}>
                <div className="skeleton skeleton-text" style={{ width: "100px" }} />
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default PendingAgencyRequestShimmer;
