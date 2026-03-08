import React from "react";
import "../../assets/scss/Shimmer/Performing.css";

const Performing = () => {
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

              {/* Host */}
              <td>
                <div className="d-flex px-2 py-1" style={{ width: "250px" }}>
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
                  <div
                    className="d-flex flex-column justify-content-center text-start ms-3"
                    style={{ width: "120px" }}
                  >
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

              {/* Agency */}
              <td>
                <div className="skeleton skeleton-text" style={{ width: "120px" }} />
              </td>

              {/* Country */}
              <td style={{paddingRight : "150px"}}>
                <div className="d-flex justify-content-end align-items-center gap-3">
                  <div style={{ width: "70px" }}>
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

              {/* Coin */}
              <td style={{paddingRight : "30px"}}>
                <div className="skeleton skeleton-text" style={{ width: "60px" }} />
              </td>

              {/* Is Online */}
              <td style={{paddingRight : "30px"}}>
                <div className="skeleton skeleton-text" style={{ width: "30px" }} />
              </td>

              {/* Date */}
              <td style={{paddingRight : "10px"}}>
                <div className="skeleton skeleton-text" style={{ width: "100px" }} />
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default Performing;
