const DashboardTable = (props : any) => {
    const{ title, mapData, data } = props
    return (
        <div>
            <div className="dashboardTable">{title}</div>
            <div className="table-wrapper">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            {
                                data?.length > 0 ?
                                <tr>
                                {mapData.map((col : any, i : number) => (
                                    <th key={i} className={`text-capitalized-normal ${col.thClass} dashboardtablehead`}>
                                        {col.Header}
                                    </th>
                                ))}
                            </tr> :
                           ""
                            }
                           
                        </thead>
                        <tbody>
                            {data.length > 0 ? (
                                data.map((row : any, i : number) => (
                                    <tr key={i} style={{ borderStyle: "none", borderBottomWidth: "none" }}>
                                        {mapData.map((col : any, ind : number) => (
                                            <td key={ind}>{col.Cell ? col.Cell({ row, index: i }) : null}</td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={mapData.length} className="text-center">
                                        No data Found !
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardTable;
