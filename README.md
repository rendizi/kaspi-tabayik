# kaspi-tabayik

**Kaspi-tabayik** is an open image search tool for the [kaspi.kz](https://kaspi.kz) marketplace.  
It enables powerful, AI-driven product search by image, making it easier to find similar or matching products directly from photographs or screenshots.

---

## 🛠 How It Works

- **Data Collection:**  
  Product images and metadata are parsed directly from kaspi.kz.

- **Embedding:**  
  Images are processed and embedded using [CLIP](https://openai.com/research/clip), a neural network model that connects vision and language.

- **Vector Database:**  
  The resulting embeddings—currently from about **30,000 products**—are stored in [Pinecone](https://www.pinecone.io/), providing fast and scalable vector similarity search.

---

## 🚀 Technologies Used

- [CLIP (Contrastive Language-Image Pretraining)](https://openai.com/research/clip)
- [Pinecone vector database](https://www.pinecone.io/)

---

## 📈 Status

More than **30,000** products have already been uploaded to the vector database.  
The service enables fast, open image search within the Kaspi.kz product catalog.
