import { createWorker } from "tesseract.js";

let imageConvertFunction = async (buffer) => {
  const worker = await createWorker("eng");
  const res = await worker.recognize(buffer);
  await worker.terminate();
  return   res.data.text
};

export default imageConvertFunction