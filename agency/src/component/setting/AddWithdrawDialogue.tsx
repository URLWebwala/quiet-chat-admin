import Button from "@/extra/Button";
import { ExInput } from "@/extra/Input";
import { closeDialog } from "@/store/dialogSlice";
import { getPaymentMethod, updateWithdrawMethod } from "@/store/settingSlice";
import { RootStore, useAppDispatch } from "@/store/store";
import { createWithdrawRequest } from "@/store/withdrawalSlice";
import { Box, Modal, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: "13px",
  border: "1px solid #C9C9C9",
  boxShadow: 24,
  p: "19px",
};

interface ErrorState {
  paymentGateway: string;
  coin: string;
  dynamicFields: string[];
}

interface DynamicFieldValue {
  label: string;
  value: string;
}

interface AddWithdrawDialogueProps {
  amount: number; // or string, depending on what you pass
}

const AddWithdrawDialogue: React.FC<AddWithdrawDialogueProps> = ({ amount }) => {
  const dispatch = useAppDispatch();
  const { dialogue, dialogueData } = useSelector(
    (state: RootStore) => state.dialogue
  );
  const { paymentMethod } = useSelector((state: RootStore) => state.setting);

  // 🟢 Here is your available earning passed from parent
  const available = amount || 0;

  const [addCategory, setAddCategory] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState<string>("");
  const [coin, setCoin] = useState<number | string>("");
  const [dynamicFields, setDynamicFields] = useState<DynamicFieldValue[]>([]);
  const [error, setError] = useState<ErrorState>({
    paymentGateway: "",
    coin: "",
    dynamicFields: [],
  });

  const selectedMethod = paymentMethod.find(
    (item) => item?.name === paymentGateway
  );

  // Fetch payment methods
  useEffect(() => {
    dispatch(getPaymentMethod());
  }, [dispatch]);

  // Show dialog when opened
  useEffect(() => {
    if (dialogue) setAddCategory(true);
  }, [dialogue]);

  // Generate dynamic fields
  useEffect(() => {
    if (selectedMethod?.details?.length > 0) {
      let labelsArray: string[] = [];

      if (typeof selectedMethod.details[0] === "string") {
        labelsArray = selectedMethod.details[0]
          .split(",")
          .map((item) => item.trim());
      }

      setDynamicFields(labelsArray.map((label) => ({ label, value: "" })));
      setError((prev) => ({
        ...prev,
        dynamicFields: labelsArray.map(() => ""),
      }));
    }
  }, [paymentGateway]);

  const handleClose = () => {
    setAddCategory(false);
    dispatch(closeDialog());
  };

  const handleDynamicFieldChange = (index: number, value: string) => {
    const updatedFields = [...dynamicFields];
    updatedFields[index].value = value;
    setDynamicFields(updatedFields);

    const updatedErrors = [...error.dynamicFields];
    const label = updatedFields[index].label.toLowerCase();

    if (!value) {
      updatedErrors[index] = `${updatedFields[index].label} is required.`;
    } else {
      updatedErrors[index] = "";
    }

    setError((prev) => ({ ...prev, dynamicFields: updatedErrors }));
  };

  // ✅ VALIDATION INCLUDING AVAILABLE EARNING CHECK
  const validateFields = () => {
    const errors: ErrorState = {
      paymentGateway: "",
      coin: "",
      dynamicFields: [],
    };

    if (!paymentGateway)
      errors.paymentGateway = "Payment Gateway is required.";

    if (!coin) errors.coin = "Coin is Required.";
    else if (Number(coin) <= 0)
      errors.coin = "Coin must be greater than 0.";
    else if (Number(coin) > Number(available))
      errors.coin = "Coin cannot be higher than available earning.";

    dynamicFields.forEach((field, index) => {
      if (!field.value) {
        errors.dynamicFields[index] = `${field.label} is required.`;
      } else {
        errors.dynamicFields[index] = "";
      }
    });

    setError(errors);

    return !(
      errors.paymentGateway ||
      errors.coin ||
      errors.dynamicFields.some((msg) => msg)
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateFields()) return;

    if (dialogueData) {
      const formData = new FormData();
      formData.append("paymentMethodId", dialogueData._id);
      dynamicFields.forEach((field) => {
        formData.append(field.label, field.value);
      });
      formData.append("coin", String(coin));

      dispatch(updateWithdrawMethod({ formData }));
    } else {
      const dynamicFieldsObject = dynamicFields.reduce((acc, item) => {
        acc[item.label] = item.value;
        return acc;
      }, {} as Record<string, string>);

      const payload = {
        paymentGateway,
        coin,
        paymentDetails: dynamicFieldsObject,
      };
      dispatch(createWithdrawRequest(payload));
    }

    handleClose();
  };

  return (
    <Modal open={addCategory} onClose={handleClose}>
      <Box sx={style} className="create-channel-model">
        {/* <div className="d-flex justify-content-between align-items-center">   */}
        {/* <div> */}
        <Typography variant="h6" className="text-theme">
          Add Withdraw Request
        </Typography>
        {/* </div> */}

        {/* <div>
           <p
          className=""
          style={{ fontSize: "15px", fontWeight: "300" }}
        >
          Available Coin : <b className="text-success"> {available}</b>
        </p>
        </div>
        </div> */}




        <form onSubmit={handleSubmit}>
          {/* PAYMENT GATEWAY */}
          <div className="inputData">
            <label htmlFor="category">Payment Gateway</label>
            <select
              id="category"
              value={paymentGateway}
              className="rounded-2"
              onChange={(e) => setPaymentGateway(e.target.value)}
            >
              <option value="">--Select Payment Gateway--</option>
              {paymentMethod.map((method) => (
                <option key={method.name} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
            {error.paymentGateway && (
              <div className="text-danger" style={{ fontSize: "16px" }}>
                {error.paymentGateway}
              </div>
            )}
          </div>

          {/* DYNAMIC FIELDS */}
          {dynamicFields.map((field, index) => (
            <div key={index} className="mt-4 add-details">
              <ExInput
                type={
                  field.label.toLowerCase().includes("number")
                    ? "number"
                    : "text"
                }
                label={field.label}
                placeholder={`Enter ${field.label}`}
                value={field.value}
                errorMessage={error.dynamicFields[index]}
                onChange={(e: any) =>
                  handleDynamicFieldChange(index, e.target.value)
                }
              />
            </div>
          ))}

          {/* COIN FIELD */}
          <div className="mt-2 add-details">
            <div className="d-flex justify-content-between mb-0">
              <label className="form-label mb-0 text-muted" style={{ fontSize: "13px" }}>
                Coin
              </label>
              <small className="text-muted" style={{ fontSize: "14px" }}>withdrawable Coin:  <strong>{available}</strong></small>
            </div>

            <ExInput
              type="number"
              placeholder="Enter coin"
              value={coin}
              errorMessage={error.coin}
              onChange={(e: any) => {
                const value = e.target.value;
                setCoin(value);

                // LIVE VALIDATION
                if (!value) {
                  return setError({ ...error, coin: "Coin is required" });
                } else if (Number(value) > Number(available)) {
                  return setError({
                    ...error,
                    coin: "Coin cannot be higher than available earning.",
                  });
                } else {
                  return setError({ ...error, coin: "" });
                }
              }}
            />
          </div>




          <p
            className="text-danger d-flex justify-content-end"
            style={{ fontSize: "16px" }}
          >
            Minimum Withdrawal Coin : 10
          </p>

          {/* BUTTONS */}
          <div className="mt-3 d-flex justify-content-end">
            <Button
              className="cancelButton text-light"
              text="Cancel"
              type="button"
              onClick={handleClose}
            />
            <Button
              className="text-white m10-left submitButton"
              text="Submit"
              type="submit"
            />
          </div>
        </form>
      </Box>
    </Modal>
  );
};

export default AddWithdrawDialogue;
