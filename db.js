import mongoose from "mongoose";
mongoose
  .connect(
    "mongodb+srv://alokmani9700:PmVEsJeG2Z3EY39X@cluster0.slz3e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    // "mongodb+srv://manishsinghbais34766:Xmv02441!@vertexfx.wgtommg.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then((data) => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.log("err", err);
  });
