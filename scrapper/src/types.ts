export interface Category{
    name: string 
    link: string 
    subcategory: Subcategory[]
}

export interface Subcategory{
    name: string 
    link: string 
    category: string 
    subsubcategory: SubSubCategory[]
}

export interface SubSubCategory{
    name: string 
    link: string 
    category: string 
    products: Product[]
}

export interface Product{
    name: string 
    url: string 
    image: string 
    price: string 
    category: string 
}