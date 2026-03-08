import React from "react";
import "../../assets/scss/Shimmer/AgencyShimmer.css";

const AgencyShimmer = () => {
  return (
    <>
      <thead>
         <tr>
          {[...Array(14)].map((_, idx) => (
            <th key={idx} scope="col" style={{ height: "50px"}}></th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array(8)
          .fill(0)
          .map((_, i) => (
             <tr key={i} >
              {/* No */}
              <td style={{ paddingLeft: "17px" }} >
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px" }}
                ></div>
              </td>

              {/* Image + Name + ID */}
              <td style={{ paddingLeft: "19px" }}>
                <div
                  className="d-flex align-items-center gap-2"
                  style={{ width: "250px" , paddingLeft: "25px"}}
                >
                  <div
                    className="skeleton skeleton-circle"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                    }}
                  ></div>
                  <div className="d-flex flex-column justify-content-center">
                    <div
                      className="skeleton skeleton-text"
                      style={{
                        width: "100px",
                        height: "14px",
                        marginBottom: "4px",
                      }}
                    ></div>
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: "70px", height: "12px" }}
                    ></div>
                  </div>
                </div>
              </td>

              {/* Value */}
              <td style={{ paddingLeft: "64px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px" }}
                ></div>
              </td>

              {/* Email */}
              <td style={{ paddingLeft: "15px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "200px" }}
                ></div>
              </td>

              {/* Phone */}
             <td style={{ paddingLeft: "50px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "120px" }}
                ></div>
              </td>

              {/* Username */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px" }}
                ></div>
              </td>

              {/* Flag + Country */}
               <td style={{ paddingLeft: "8px" }}>
                <div className="d-flex align-items-center gap-2" style={{paddingLeft: "30px"}}>
                  <div
                    className="skeleton skeleton-circle"
                    style={{ width: "40px", height: "40px" }}
                  ></div>
                  <div
                    className="skeleton skeleton-text"
                    style={{ width: "60px" }}
                  ></div>
                </div>
              </td>

              {/* Coins */}
              <td style={{ paddingLeft: "25px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "60px" }}
                ></div>
              </td>

              {/* Recharge */}
              <td style={{ paddingLeft: "55px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "50px" }}
                ></div>
              </td>

              {/* Following */}
              <td style={{ paddingLeft: "45px" }}>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "20px" }}
                ></div>
              </td>

              {/* Created At */}
              <td>
                <div
                  className="skeleton skeleton-text"
                  style={{ width: "100px" }}
                ></div>
              </td>

              {/* Block Toggle */}
              <td>
                <div
                  className="skeleton skeleton-pill"
                  style={{ width: "50px", height: "25px" }}
                ></div>
              </td>

              {/* Icon 1 */}
              <td>
                <div
                  className="skeleton skeleton-icon"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "10px",
                  }}
                ></div>
              </td>

              {/* Icon 2 */}
              <td style={{ paddingLeft: "25px" }}>
                <div
                  className="skeleton skeleton-icon"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "10px",
                  }}
                ></div>
              </td>
            </tr>
          ))}
      </tbody>
    </>
  );
};

export default AgencyShimmer;
