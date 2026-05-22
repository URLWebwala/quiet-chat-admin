const ToggleSwitch = (props: any) => {
  const handleChange = props.onChange || props.onClick;
  const isChecked = props.checked ?? props.value ?? false;
  return (
    <>
      <label className="switch">
        <input type="checkbox" checked={isChecked} onChange={handleChange} />
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
