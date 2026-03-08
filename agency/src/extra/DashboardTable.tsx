import { isSkeleton } from "@/utils/allSelector";
import { useSelector } from "react-redux";

const DashboardTable = ({ title, mapData, data , shimmer }: any) => {
    const roleSkeleton = useSelector(isSkeleton);
    return (
        <div>
            <div className="dashboardTable">{title}</div>
            <div className="table-wrapper" style={{ minHeight: "400px" }}>
                <div className="table-container">
                    <table className="table">
                        {roleSkeleton ? (
                            <>
                                {/* <thead>
                                    <tr>
                                        {mapData.map((res: any, i: number) => {
                                            return (
                                                <th
                                                    className={` ${res.thClass} text-capitalized-normal text-nowrap`}
                                                    key={i}
                                                    // width={res.width}
                                                    style={{
                                                        minWidth: res.width ? res.width : "100px",
                                                    }}
                                                >
                                                    <div
                                                        className={`${res.thClass}`}
                                                        style={{ height: "20px", paddingLeft: i === 0 ? "68px" : "0px" }}
                                                    ></div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead> */}
                                {shimmer}
                                <tbody>
                                    {Array(6)
                                        .fill(0)
                                        .map((res, i) => {
                                            return (
                                                <>
                                                    <tr key={i} style={{ height: "80px" }}>
                                                        {mapData?.map((res: any, ind: number) => {
                                                            return (
                                                                <td key={ind}>
                                                                    <div
                                                                        className="skeleton"
                                                                        style={{ height: "20px", width: "70%" }}
                                                                    ></div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                </>
                                            );
                                        })}
                                </tbody>
                            </>
                        ) : (
                            <>
                                <thead className="text-nowrap">
                                    {
                                        data?.length > 0 ?
                                            <tr>
                                                {mapData.map((col: any, i: number) => (
                                                    <th key={i} className={`text-capitalized-normal ${col.thClass} dashboardtablehead`}>
                                                        {col.Header}
                                                    </th>
                                                ))}
                                            </tr> :
                                            ""
                                    }

                                </thead>
                                <tbody>
                                    {data?.length > 0 ? (
                                        <>
                                            {data.map((row: any, i: number) => (
                                                <tr key={i}>
                                                    {mapData.map((col: any, ind: number) => (
                                                        <td key={ind}>
                                                            {col.Cell ? col.Cell({ row, index: i }) : null}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}

                                            {[...Array(Math.max(0, 8 - data.length))].map((_, idx) => (
                                                <tr key={`empty-${idx}`}>
                                                    {mapData.map((_: any, colIndex: number) => (
                                                        <td
                                                            key={`empty-cell-${colIndex}`}
                                                            style={{
                                                                borderTop: "1px solid rgb(216 216 216 / 50%)",
                                                                borderBottom: "1px solid rgb(216 216 216 / 50%)",
                                                                borderLeft: "none",
                                                                borderRight: "none",
                                                                height: "60px",
                                                            }}
                                                        ></td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </>
                                    ) :
                                        (
                                            <>
                                                {[...Array(9)].map((_, rowIndex) => (
                                                    <tr key={`nodata-${rowIndex}`} style={{ height: "62px" }}>
                                                        {rowIndex === 4 ? ( // Center it in the middle row (row 5 of 9)
                                                            <td
                                                                colSpan={mapData.length}
                                                                className="text-center"
                                                                style={{
                                                                    borderBottom: "none",
                                                                    border: "none",
                                                                    padding: "20px 0",
                                                                }}
                                                            >
                                                                No Data Found!
                                                            </td>
                                                        ) : (
                                                            mapData.map((res: any, colIndex: any) => (
                                                                <td key={`empty-cell-${colIndex}`} style={{ border: "1px solid #eee" }} />
                                                            ))
                                                        )}
                                                    </tr>
                                                ))}
                                            </>
                                        )

                                    }
                                </tbody>
                            </>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardTable;
