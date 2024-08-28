import { QueryObject } from "./FileUpload";

interface ProductListProps {
    products: QueryObject[];
  }
  
const ProductList: React.FC<ProductListProps> = ({ products }) => {
    return (
      <div className="flex flex-col justify-center items-center bg-white">
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-2/3">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-400 rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105"
            >
              <img
                src={product.metadata.image}
                alt={product.metadata.name}
                className="w-48 h-48 object-contain"
              />
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{product.metadata.name}</h3>
                <p className="text-lg text-gray-600 mb-4">{product.metadata.price}</p>
                <a
                  href={product.metadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-500 hover:text-blue-700 font-medium transition-colors duration-300"
                >
                  View Details
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default ProductList;