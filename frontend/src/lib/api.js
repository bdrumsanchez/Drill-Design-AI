export async function generateDrill(formType, count, params, steps) {
  const res = await fetch("http://localhost:8000/drill/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_type: formType, count, params, steps }),
  });
  return res.json();
}
