const ToggleSwitch = (props: any) => {
  const handleChange = props.onChange || props.onClick;
  const isChecked = props.checked ?? props.value ?? false;
  const isDisabled = props.disabled || false;
  return (
    <>
      <label className="switch" style={{ pointerEvents: isDisabled ? "none" : "auto", opacity: isDisabled ? 0.65 : 1 }}>
        <input type="checkbox" checked={isChecked} onChange={handleChange} disabled={isDisabled} />
        <div className="slider"></div>
        <div className="slider-card">
          <div className="slider-card-face slider-card-front"></div>
          <div className="slider-card-face slider-card-back"></div>
        </div>
      </label>
    </>
  );
};

export default ToggleSwitch;
