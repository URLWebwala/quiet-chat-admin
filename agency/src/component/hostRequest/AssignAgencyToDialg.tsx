import { RootStore } from "@/store/store";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { closeDialog } from "@/store/dialogSlice";
import { assignToExpertAccepted, getAgencyList } from "@/store/hostRequestSlice";
import Button from "@/extra/Button";

interface Agency {
    _id: string;
    name: string;
}

const AssignAgencyToDialog = () => {
    const dispatch = useDispatch();
    const { dialogueData } = useSelector((state: RootStore) => state.dialogue);
    const { agencyList } = useSelector((state: RootStore) => state.hostRequest);

    const [selectedAgency, setSelectedAgency] = useState<string>(""); // Ensure it's a string
    const [error, setError] = useState<{ agencyName?: string }>({});

    useEffect(() => {
        dispatch(getAgencyList());
    }, [dispatch]);

    const handleAccept = () => {
       
        if (!selectedAgency) {
            setError({ agencyName: "Agency is required!" }); // Properly updating error
            return; // Prevent function execution
        } else {
            

            const payload = {
                agencyId: selectedAgency,
                requestId: dialogueData?.row?._id,
            };

            dispatch(assignToExpertAccepted(payload));

            dispatch(closeDialog());
        }


    };

    return (
        <div className="dialog">
            <div className="w-100 h-100">
                <div className="h-100 row justify-content-center align-items-center">
                    <div className="col-xl-4 col-md-6 col-11">
                        <div className="mainDiaogBox1">
                            {/* Header */}
                            <div className="row justify-content-between align-items-center formHead">
                                <div className="col-10">
                                    <h2 className="text-theme m0">
                                        {dialogueData && "Agency assign to host"}
                                    </h2>
                                </div>
                                <div className="col-2">
                                    <div className="closeButton fs-18" onClick={() => dispatch(closeDialog())}>
                                        ✖
                                    </div>
                                </div>
                            </div>

                            {/* Select Dropdown */}
                            <div className="position-relative">
                                <div className="col-12">
                                    <div className="inputData">
                                        <label htmlFor="category">Agency</label>
                                        <select
                                            id="category"
                                            className="rounded-2"
                                            value={selectedAgency}
                                            onChange={(e) => {
                                                setSelectedAgency(e.target.value);
                                                setError({ agencyName: "" }); // Clear error when valid
                                            }}
                                        >
                                            <option value="" disabled>
                                                --Select Agency--
                                            </option>
                                            {agencyList?.map((data: Agency) => (
                                                <option key={data._id} value={data._id}>
                                                    {data.name}
                                                </option>
                                            ))}
                                        </select>
                                        {error.agencyName && <p className="errorMessage text-start">{error.agencyName}</p>}
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="d-flex justify-content-end mt-3 gap-2">
                                    <Button
                                        className={`cancelButton text-light`}
                                        text={`Cancel`}
                                        type={`button`}
                                        onClick={() => dispatch(closeDialog())}
                                    />
                                    <Button
                                        type={`submit`}
                                        className={` text-white m10-left submitButton`}
                                        btnName={dialogueData ? "Update" : "Submit"}
                                        text={`Submit`}
                                        // style={{ backgroundColor: "#1ebc1e" }}
                                        onClick={handleAccept}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignAgencyToDialog;
