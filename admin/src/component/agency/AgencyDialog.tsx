import Button from "@/extra/Button";
import { ExInput, Textarea } from "@/extra/Input";
import { closeDialog } from "@/store/dialogSlice";
import { getGiftCategory } from "@/store/giftSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import React, { useEffect, useState } from "react";
import ReactSelect from "react-select";
import { useSelector } from "react-redux";
import { createAgency, updateAgency } from "@/store/agencySlice";
import { baseURL } from "@/utils/config";
import {
    createUserWithEmailAndPassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    signInWithEmailAndPassword,
    updateEmail,
    updatePassword,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import axios from "axios";
import countriesData from "@/api/countries.json";
import male from "@/assets/images/male.png";
import { toast } from "react-toastify";

interface ErrorState {
    name: string;
    email: string;
    commission: string;
    password: string;
    mobileNumber: string;
    country: string;
    image: string;
    description: string;
    countryCode: string;
}

const AgencyDialog = () => {
    const dispatch = useAppDispatch();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [commission, setCommission] = useState("");
    const [password, setPassword] = useState("");
    const [mobileNumber, setMobileNumber] = useState("");

    // FIXED: Separate state for options and selected value
    const [countryOptions, setCountryOptions] = useState<any[]>([]); // All countries
    const [selectedCountry, setSelectedCountry] = useState<any>(null); // Selected country

    const [countryCode, setCountryCode] = useState<any>();
    const { countryData } = useSelector((state: any) => state.admin);
    const [imagePath, setImagePath] = useState<string>();
    const [description, setDescription] = useState();
    const [image, setImage] = useState();
    const { dialogue, dialogueData } = useSelector(
        (state: RootStore) => state.dialogue
    );
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const updatedImagePath = dialogueData?.image.replace(/\\/g, "/");

    useEffect(() => {
        setName(dialogueData?.name);
        setEmail(dialogueData?.email);
        setCommission(dialogueData?.commission);
        setPassword(dialogueData?.password);
        setMobileNumber(dialogueData?.mobileNumber);
        setImagePath(dialogueData?.image ? baseURL + updatedImagePath : "");
        setDescription(dialogueData?.description);
        setCountryCode(`${dialogueData?.countryCode}`);
    }, [countryData]);

    // FIXED: Process countries and set selected country
    useEffect(() => {
        const processCountries = () => {
            setLoadingCountries(true);

            try {
                // Transform countries to React Select format
                const transformedCountries = countriesData
                    .filter(
                        (country) =>
                            country.name?.common &&
                            country.cca2 &&
                            country.flags?.png
                    )
                    .map((country) => ({
                        value: country.cca2, // Required by React Select
                        label: country.name.common, // Required by React Select
                        name: country.name.common,
                        code: country.cca2,
                        flagUrl: country.flags.png || country.flags.svg,
                        flag: country.flags.png || country.flags.svg, // For compatibility
                    }))
                    .sort((a, b) => a.label.localeCompare(b.label));

                setCountryOptions(transformedCountries);

                // Set default or existing country
                if (dialogueData?.country) {
                    const existingCountry = transformedCountries.find(
                        (c: any) =>
                            c.name.toLowerCase() ===
                            dialogueData.country.toLowerCase()
                    );
                    setSelectedCountry(existingCountry || null);
                } else {
                    // Set India as default
                    const defaultCountry = transformedCountries.find(
                        (c: any) => c.name === "India"
                    );
                    setSelectedCountry(
                        defaultCountry || transformedCountries[0] || null
                    );
                }
            } catch (error) {
                console.error("Failed to process countries:", error);
            } finally {
                setLoadingCountries(false);
            }
        };

        processCountries();
    }, [dialogueData]);

    useEffect(() => {
        setName(dialogueData?.name);
    }, [dialogueData]);

    const [error, setError] = useState({
        name: "",
        email: "",
        commission: "",
        password: "",
        mobileNumber: "",
        country: "",
        image: "",
        description: "",
        countryCode: "",
    });

    const CustomOption = ({ innerRef, innerProps, data }: any) => (
        <div
            ref={innerRef}
            {...innerProps}
            className="optionShow-option p-2 d-flex align-items-center"
        >
            <img
                height={24}
                width={32}
                alt={data.name}
                src={data.flagUrl}
                className="me-2"
                style={{ objectFit: "cover" }}
            />
            <span>{data.label}</span>
        </div>
    );

    // FIXED: Improved Firebase authentication handling
    const updateFirebaseCredentials = async (
        currentEmail: string,
        currentPassword: string,
        newEmail?: string,
        newPassword?: string
    ): Promise<User | null> => {
        try {
            // Step 1: Sign in with current credentials
            console.log("Signing in with current credentials...");
            const userCredential = await signInWithEmailAndPassword(
                auth,
                currentEmail,
                currentPassword
            );

            const user = userCredential.user;
            console.log("Successfully signed in user:", user.uid);

            // Step 2: Create fresh credential for reauthentication
            const credential = EmailAuthProvider.credential(
                currentEmail,
                currentPassword
            );

            // Step 3: Reauthenticate to ensure we have fresh tokens
            // console.log("Reauthenticating user...");
            await reauthenticateWithCredential(user, credential);
            console.log("Successfully reauthenticated");

            // Step 4: Update email if provided
            if (newEmail && newEmail !== currentEmail) {
                console.log(
                    "Updating email from",
                    currentEmail,
                    "to",
                    newEmail
                );
                await updateEmail(user, newEmail);
                console.log("Successfully updated email");
            }

            // Step 5: Update password if provided
            if (newPassword && newPassword !== currentPassword) {
                console.log("Updating password...");
                await updatePassword(user, newPassword);
                console.log("Successfully updated password");
            }

            return user;
        } catch (error: any) {
            console.error("Firebase authentication error:", error);

            // Create user-friendly error object
            const userError = {
                code: error.code,
                isAuthError: true,
                message: getUserFriendlyErrorMessage(error.code),
            };

            throw userError;
        }
    };

    // Helper function for user-friendly error messages
    const getUserFriendlyErrorMessage = (errorCode: string): string => {
        switch (errorCode) {
            case "auth/user-mismatch":
                return "Authentication failed. Please try again.";
            case "auth/user-not-found":
                return "User not found. Please check your credentials.";
            case "auth/wrong-password":
                return "Current password is incorrect.";
            case "auth/invalid-email":
                return "Please enter a valid email address.";
            case "auth/email-already-in-use":
                return "This email is already registered. Please use a different email.";
            case "auth/weak-password":
                return "Password should be at least 6 characters long.";
            case "auth/requires-recent-login":
                return "Please log in again and try updating your information.";
            case "auth/invalid-credential":
                return "Invalid credentials. Please check your email and password.";
            case "auth/too-many-requests":
                return "Too many failed attempts. Please try again later.";
            default:
                return "An error occurred. Please try again.";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {

        e.preventDefault();

        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            // 1) Front-end validation
            const newError: Partial<ErrorState> = {};
            if (!name) newError.name = "Name is required";
            if (!email) newError.email = "Email is required";
            else if (!email.includes("@"))
                newError.email = "Email must include '@'";
            if (!commission) newError.commission = "Commission is required";
            if (!dialogueData && !password)
                newError.password = "Password is required";
            if (!mobileNumber)
                newError.mobileNumber = "Mobile Number is required";
            if (!description) newError.description = "Description is required";
            if (!countryCode) newError.countryCode = "Country code is required";
            else if (countryCode <= 0)
                newError.countryCode = "Country code must be > 0";
            if (!selectedCountry) newError.country = "Country is required";

            if (Object.keys(newError).length) {
                setError(newError as ErrorState);
                return;
            }

            // Clear previous errors
            setError({} as ErrorState);

            // 2) Build FormData
            const formData: any = new FormData();
            const isEdit = Boolean(dialogueData);

            const appendIfChanged = (key: string, value: any) => {
                if (!isEdit || dialogueData![key] !== value) {
                    formData.append(key, String(value));
                }
            };

            appendIfChanged("name", name);
            appendIfChanged("email", email);
            appendIfChanged("commission", commission);
            appendIfChanged("password", password || "");
            appendIfChanged("mobileNumber", mobileNumber);
            appendIfChanged("description", description);
            appendIfChanged("commissionType", "1");
            appendIfChanged("countryCode", countryCode);

            if (!isEdit || image) {
                formData.append("image", image!);
            }
            if (!isEdit || selectedCountry?.name !== dialogueData?.country) {
                formData.append("country", selectedCountry!.name);
            }
            if (
                !isEdit ||
                selectedCountry?.flag !== dialogueData?.countryFlagImage
            ) {
                formData.append("countryFlagImage", selectedCountry!.flag);
            }

            let user: User | null = null;

            if (isEdit) {
                const emailChanged = email !== dialogueData.email;
                const passwordChanged =
                    password &&
                    password.length > 0 &&
                    password !== dialogueData?.password;

                if (passwordChanged) {
                    try {
                        user = await updateFirebaseCredentials(
                            dialogueData.email,
                            dialogueData.password,
                            emailChanged ? email : undefined,
                            passwordChanged ? password : undefined
                        );

                        if (user) {
                            formData.append("uid", user.uid);
                        }
                    } catch (authError: any) {
                        console.error("Credential update failed:", authError);

                        if (authError.isAuthError) {
                            // Handle specific auth errors by setting form field errors
                            const fieldError: Partial<ErrorState> = {};

                            if (authError.code === "auth/email-already-in-use") {
                                toast.error("This email is already in use");
                            } else if (
                                authError.code === "auth/weak-password"
                            ) {
                                toast.error(
                                    "Password should be at least 6 characters long"
                                );
                            } else if (
                                authError.code === "auth/invalid-email"
                            ) {
                                toast.error(
                                    "Please enter a valid email address"
                                );
                            } else if (
                                authError.code === "auth/wrong-password"
                            ) {
                                // This shouldn't happen in edit mode, but just in case
                                toast.error(
                                    "Current password verification failed"
                                );
                                return;
                            } else {
                                toast.error("unexpected error occurred");
                                return;
                            }

                            // setError(fieldError as ErrorState);
                            return;
                        } else {
                            toast.error("Failed to update credentials");
                            return;
                        }
                    }
                }

                // Update in backend
                await dispatch(
                    updateAgency({ agencyId: dialogueData!._id, formData })
                ).unwrap();

            } else {
                // Create new agency
                try {
                    const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password!
                    );
                    user = userCredential.user;
                    formData.append("uid", user.uid);

                    await dispatch(createAgency(formData)).unwrap();
                } catch (createError: any) {
                    console.error("Agency creation failed:", createError);

                    // Handle Firebase auth errors during creation
                    if (createError.code) {
                        const fieldError: Partial<ErrorState> = {};

                        switch (createError.code) {
                            case "auth/email-already-in-use":
                                fieldError.email =
                                    "This email is already registered";
                                break;
                            case "auth/weak-password":
                                fieldError.password =
                                    "Password should be at least 6 characters long";
                                break;
                            case "auth/invalid-email":
                                fieldError.email =
                                    "Please enter a valid email address";
                                break;
                            default:
                                toast.error("Failed to create agency");
                                return;
                        }

                        setError(fieldError as ErrorState);

                        // Clean up user if created
                        if (user) {
                            try {
                                await user.delete();
                            } catch (deleteError) {
                                console.error(
                                    "Failed to cleanup user:",
                                    deleteError
                                );
                            }
                        }
                        return;
                    } else {
                        // Backend error
                        if (user) {
                            try {
                                await user.delete();
                            } catch (deleteError) {
                                console.error(
                                    "Failed to cleanup user:",
                                    deleteError
                                );
                            }
                        }
                        toast.error("Failed to create agency");
                        return;
                    }
                }
            }

            dispatch(closeDialog());
        } catch (err: any) {
            console.error("Unexpected error:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // FIXED: Handle country selection properly
    const handleSelectChange = (selected: any | null) => {
        setSelectedCountry(selected);

        if (!selected) {
            return setError({
                ...error,
                country: `Country Is Required`,
            });
        } else {
            return setError({
                ...error,
                country: "",
            });
        }
    };

    const handleInputImage = (e: any) => {
        if (e.target.files) {
            setImage(e?.target?.files[0]);
            setImagePath(URL.createObjectURL(e.target.files[0]));
            setError({ ...error, image: "" });
        }
    };

    return (
        <>
            <div className="dialog">
                <div style={{ width: "1800px" }}>
                    <div className="row justify-content-center">
                        <div className="col-xl-5 col-md-8 col-11">
                            <div
                                className="mainDiaogBox"
                                style={{ width: "600px" }}
                            >
                                <div className="row justify-content-between align-items-center formHead">
                                    <div className="col-8">
                                        <h2 className="text-theme fs-26 m0">
                                            {dialogueData
                                                ? "Edit Agency"
                                                : "Create Agency"}
                                        </h2>
                                    </div>
                                    <div className="col-4">
                                        <div
                                            className="closeButton"
                                            onClick={() => {
                                                dispatch(closeDialog());
                                            }}
                                            style={{ fontSize: "20px" }}
                                        >
                                            ✖
                                        </div>
                                    </div>
                                </div>

                                <div className="row formFooter mt-3">
                                    <div className="col-6">
                                        <ExInput
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={name}
                                            label="Name"
                                            placeholder="Name"
                                            errorMessage={error && error.name}
                                            onChange={(e: any) => {
                                                setName(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        name: "Name is required",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        name: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <ExInput
                                            type="text"
                                            id="email"
                                            name="email"
                                            value={email ? email.toLowerCase() : ""}
                                            style={{ textTransform: "lowercase" }}
                                            label="Email"
                                            placeholder="Email"
                                            autoCapitalize="none"
                                            spellCheck={false}
                                            errorMessage={error && error.email}
                                            onChange={(e: any) => {
                                                const value = e.target.value.toLowerCase();
                                                setEmail(value);

                                                if (!value) {
                                                    return setError({
                                                        ...error,
                                                        email: "Email is required",
                                                    });
                                                } else if (
                                                    !value.includes("@")
                                                ) {
                                                    return setError({
                                                        ...error,
                                                        email: "Email must include '@'",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        email: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="col-6">
                                        <ExInput
                                            type="number"
                                            id="commission"
                                            name="commission"
                                            value={commission}
                                            label="Commission (%)"
                                            placeholder="Commission"
                                            errorMessage={
                                                error && error.commission
                                            }
                                            onChange={(e: any) => {
                                                setCommission(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        commission:
                                                            "Commission is required",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        commission: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <ExInput
                                            type="password"
                                            id="title"
                                            name="title"
                                            value={password}
                                            label={"Password"}
                                            placeholder="Password"
                                            errorMessage={
                                                error && error.password
                                            }
                                            onChange={(e: any) => {
                                                setPassword(e.target.value);
                                                if (
                                                    !dialogueData &&
                                                    !e.target.value
                                                ) {
                                                    return setError({
                                                        ...error,
                                                        password:
                                                            "Password is required",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        password: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <ExInput
                                            type="number"
                                            id="countryCode"
                                            name="countryCode"
                                            value={countryCode}
                                            label="Country Code"
                                            placeholder="+91"
                                            errorMessage={
                                                error && error.countryCode
                                            }
                                            onChange={(e: any) => {
                                                const value = e.target.value;
                                                setCountryCode(value);

                                                if (!value) {
                                                    return setError({
                                                        ...error,
                                                        countryCode:
                                                            "Country Code is required",
                                                    });
                                                } else if (value <= 0) {
                                                    return setError({
                                                        ...error,
                                                        countryCode:
                                                            "Country Code can not less than or eual to 0",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        countryCode: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-6">
                                        <ExInput
                                            type="number"
                                            id="mobileNumber"
                                            name="mobileNumber"
                                            value={mobileNumber}
                                            label="Mobile Number"
                                            placeholder="Mobile Number"
                                            errorMessage={
                                                error && error.mobileNumber
                                            }
                                            onChange={(e: any) => {
                                                const value = e.target.value;
                                                setMobileNumber(value);

                                                if (!value) {
                                                    return setError({
                                                        ...error,
                                                        mobileNumber:
                                                            "Mobile Number is required",
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        mobileNumber: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* FIXED: Country Select */}
                                    <div className="col-12 col-sm-12 col-md-12 col-lg-12">
                                        <div className="custom-input">
                                            <label className="">Country</label>
                                            <ReactSelect
                                                options={countryOptions} // FIXED: Use options array
                                                value={selectedCountry} // FIXED: Use selected country
                                                isClearable={true}
                                                isLoading={loadingCountries}
                                                placeholder="Select a country..."
                                                onChange={handleSelectChange}
                                                className="mt-2"
                                                classNamePrefix="react-select"
                                                formatOptionLabel={(option) => (
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            height={20}
                                                            width={28}
                                                            alt={option.name}
                                                            src={option.flagUrl}
                                                            className="me-2"
                                                            style={{
                                                                objectFit:
                                                                    "cover",
                                                            }}
                                                            onError={(
                                                                e: any
                                                            ) => {
                                                                e.target.style.display =
                                                                    "none";
                                                            }}
                                                        />
                                                        <span>
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                )}
                                                components={{
                                                    Option: CustomOption,
                                                }}
                                                styles={{
                                                    option: (
                                                        provided,
                                                        state
                                                    ) => ({
                                                        ...provided,
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                            backgroundColor:
                                                                "#f8f9fa",
                                                        },
                                                    }),
                                                }}
                                            />
                                            {error.country && (
                                                <div className="text-danger mt-1">
                                                    {error.country}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <ExInput
                                            type={"file"}
                                            label={"Image"}
                                            accept={"image/png, image/jpeg"}
                                            errorMessage={
                                                error.image && error.image
                                            }
                                            onChange={handleInputImage}
                                        />
                                        <span
                                            className="text-danger"
                                            style={{ fontSize: "12px" }}
                                        >
                                            Image (Accepted formats: png, jpeg)
                                        </span>
                                    </div>

                                    <div className=" mt-2 fake-create-img mb-2">
                                        {imagePath && (
                                            <>
                                                <img
                                                    src={
                                                        imagePath
                                                            ? imagePath
                                                            : dialogueData?.image
                                                    }
                                                    className="mt-3 rounded float-left mb-2"
                                                    alt="image"
                                                    style={{
                                                        width: "100px",
                                                        height: "100px",
                                                    }}
                                                    onError={(e: any) => {
                                                        e.target.onerror = null;
                                                        e.target.src = male.src;
                                                    }}
                                                />
                                            </>
                                        )}
                                    </div>

                                    <div className="col-12 mt-2">
                                        <Textarea
                                            row={3}
                                            type={`text`}
                                            id={`description`}
                                            name={`description`}
                                            value={description}
                                            defaultValue={
                                                description && description
                                            }
                                            label={`Description`}
                                            placeholder={`Description`}
                                            errorMessage={
                                                error.description &&
                                                error.description
                                            }
                                            onChange={(e: any) => {
                                                setDescription(e.target.value);
                                                if (!e.target.value) {
                                                    return setError({
                                                        ...error,
                                                        description: `Description is required`,
                                                    });
                                                } else {
                                                    return setError({
                                                        ...error,
                                                        description: "",
                                                    });
                                                }
                                            }}
                                        />
                                    </div>

                                    <div className="col-12 text-end m0">
                                        <Button
                                            className={`cancelButton text-white`}
                                            text={`Cancel`}
                                            type={`button`}
                                            onClick={() =>
                                                dispatch(closeDialog())
                                            }
                                            disabled={isSubmitting}
                                        />
                                        <Button
                                            type={`submit`}
                                            className={` text-white m10-left submitButton`}
                                            text={
                                                isSubmitting
                                                    ? "Processing..."
                                                    : "Submit"
                                            }
                                            onClick={(e: any) =>
                                                handleSubmit(e)
                                            }
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AgencyDialog;
