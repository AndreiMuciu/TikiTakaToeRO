import "../../styles/components/form-button.css";

function FormButton({ text = "Submit" }) {
  return (
    <button type="submit" className="form-button">
      {text}
    </button>
  );
}

export default FormButton;
