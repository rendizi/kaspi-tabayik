import { Page } from "puppeteer";
import { Product, Category, Subcategory, SubSubCategory } from "./types";
import Redis from 'ioredis';
import dotenv from "dotenv"

dotenv.config();

console.log();


const redis = new Redis('redis://default:vrYkwQoTbGitvBzlwHMGbNkyPBCayCcb@monorail.proxy.rlwy.net:32610');


export class ScrapperService {
    async getCategories(page: Page): Promise<Category[]> {
        const response: Category[] = [];
        const maxRetries = 3; 
        let attempt = 0;
        
        const userAgents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36",
            "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Mobile Safari/537.36"
        ];

        const retryRequest = async (page: Page, url: string): Promise<void> => {
            attempt++;
            const userAgent = userAgents[attempt % userAgents.length];
            console.log(`Attempt ${attempt}: Setting user-agent to ${userAgent}`);
            await page.setUserAgent(userAgent);
            console.log(`Attempt ${attempt}: Navigating to ${url}`);
            const response = await page.goto(url);
            if (response && response.status() !== 200) {
                console.warn(`Attempt ${attempt}: Received non-200 status code (${response.status()}). Retrying...`);
                if (attempt < maxRetries) {
                    await retryRequest(page, url);
                } else {
                    throw new Error(`Failed to load the page after ${maxRetries} attempts.`);
                }
            } else {
                console.log(`Attempt ${attempt}: Page loaded successfully with status ${response?.status()}`);
            }
        };

        try {
            console.log('Starting to fetch categories...');
            await retryRequest(page, "https://kaspi.kz/shop/c/smartphones%20and%20gadgets/?source=kaspikz");
            
            const dialogSelector = '.dialog.animation-fadeIn.current-location__dialog-wrapper';
            await page.waitForSelector(dialogSelector);
            console.log('Dialog is visible.');

            const closeButtonSelector = '.dialog__close i.icon_close';
            await page.click(closeButtonSelector);
            console.log('Dialog close button clicked.');

            await page.waitForSelector(dialogSelector, { hidden: true });
            console.log('Dialog is closed.');
            
            await page.waitForSelector('.nav__el-link');

            const categoriesList = await page.$$('.nav__el-link');
            console.log(`Found ${categoriesList.length} category elements.`);
            
            for (const categoryElement of categoriesList) {
                console.log('Hovering over category element...');
                await categoryElement.hover();
                await page.waitForSelector('.nav__sub-list-row');

                const categoryName = await page.evaluate((el: Element) => el.textContent?.trim() || '', categoryElement);
                const categoryLink = await page.evaluate((el: Element) => (el as HTMLAnchorElement).href, categoryElement);
                console.log(`Category: ${categoryName}, Link: ${categoryLink}`);

                const subCategoriesElements = await page.$$('.nav__sub-list-row-el');
                console.log(`Found ${subCategoriesElements.length} subcategory elements.`);
                
                const subcategories: Subcategory[] = [];
                let subcategoryIndex = 0;

                for (const subCategoryElement of subCategoriesElements) {
                    try {
                        console.log(`Processing subcategory ${subcategoryIndex + 1}...`);
                        await subCategoryElement.hover();
                        await page.waitForSelector('.nav__sub-el-link');

                        const subCategoryName = await page.evaluate((el: Element) => el.textContent?.trim() || '', subCategoryElement);
                        const subCategoryLink = await page.evaluate((el: Element) => (el as HTMLAnchorElement).href, subCategoryElement);
                        console.log(`  Subcategory: ${subCategoryName}, Link: ${subCategoryLink}`);

                        const subSubCategoriesElements = await page.$$('.nav__sub-el');
                        console.log(`  Found ${subSubCategoriesElements.length} subsubcategory elements.`);
                        const subsubcategories: SubSubCategory[] = [];
                        let subSubCategoryIndex = 0;
                        if (subCategoriesElements.length === 0){
                            const linkElement = await page.$('.nav__sub-el-link');

                            if (linkElement) {
                                const name = await page.evaluate(el => el.textContent?.trim() || '', linkElement);
                                const href = await page.evaluate(el => (el as HTMLAnchorElement).href || '', linkElement);
                        
                                subsubcategories.push({
                                    name,
                                    link: href,
                                    category: subCategoryName,
                                    products: [] 
                                });
                            }
                        }

                        for (const subSubCategoryElement of subSubCategoriesElements) {
                            try {
                                const subSubCategoryLinks = await page.evaluate((el: Element) => {
                                    return Array.from(el.querySelectorAll('.nav__sub-list-el-link')).map(link => ({
                                        name: link.textContent?.trim() || '',
                                        href: (link as HTMLAnchorElement).href || '',
                                    }));
                                }, subSubCategoryElement);
                                
                                const products: Product[] = [];
                                subSubCategoryLinks.forEach(({ name, href }) => {
                                    subsubcategories.push({
                                        name: name,
                                        link: href,
                                        category: subCategoryName,
                                        products: products,
                                    });
                                });                                
                            } catch (error) {
                                console.error(`    Error processing subsubcategory at index ${subSubCategoryIndex}:`, error);
                                if (attempt < maxRetries) {
                                    console.warn(`    Retrying subsubcategory at index ${subSubCategoryIndex}. Attempt ${attempt}...`);
                                    await retryRequest(page, categoryLink);
                                    subSubCategoryIndex--;
                                } else {
                                    throw error;
                                }
                            }
                            subSubCategoryIndex++;
                        }

                        subcategories.push({
                            name: subCategoryName,
                            link: subCategoryLink,
                            category: categoryName,
                            subsubcategory: subsubcategories,
                        });
                    } catch (error) {
                        console.error(`  Error processing subcategory at index ${subcategoryIndex}:`, error);
                        if (attempt < maxRetries) {
                            console.warn(`  Retrying subcategory at index ${subcategoryIndex}. Attempt ${attempt}...`);
                            await retryRequest(page, categoryLink);
                            subcategoryIndex--;
                        } else {
                            throw error;
                        }
                    }
                    subcategoryIndex++;
                }

                response.push({
                    name: categoryName,
                    link: categoryLink,
                    subcategory: subcategories,
                });

                console.log(`Category ${categoryName} processed successfully.`);
                break; 
            }
        } catch (error) {
            console.error('Error extracting categories:', error);
        }

        return response;
    }

    private readonly productUserAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36"
    ];

    async GetProducts(page: Page, url: string, category: string): Promise<Product[]> {
        const response: Product[] = [];
        const maxRetries = 3; 
        let attempt = 0;
    
        const addToRedis = async (url: string) => {
            await redis.lpush('failed_urls', url);
            console.log(`Added ${url} to Redis for retrying later.`);
        };
    
        const retryRequest = async (page: Page, url: string): Promise<void> => {
            attempt++;
            const userAgent = this.productUserAgents[attempt % this.productUserAgents.length];
            console.log(`Attempt ${attempt}: Setting user-agent to ${userAgent}`);
            await page.setUserAgent(userAgent);
            console.log(`Attempt ${attempt}: Navigating to ${url}`);
            const response = await page.goto(url, { waitUntil: 'networkidle2' });
            if (response && response.status() !== 200) {
                console.warn(`Attempt ${attempt}: Received non-200 status code (${response.status()}). Retrying...`);
                if (attempt < maxRetries) {
                    await retryRequest(page, url);
                } else {
                    console.error(`Failed to load the page after ${maxRetries} attempts.`);
                    throw new Error(`Failed to load the page after ${maxRetries} attempts.`);
                }
            } else {
                console.log(`Attempt ${attempt}: Page loaded successfully with status ${response?.status()}`);
            }
        };
    
        const fetchProductsFromPage = async (page: Page): Promise<Product[]> => {
            await page.waitForSelector('.item-cards-grid');
            console.log('Product grid is visible.');
    
            return page.evaluate((category: string) => {
                const productElements = document.querySelectorAll('.item-card');
                console.log(productElements.length);
                return Array.from(productElements).map((el) => {
                    const nameElement = el.querySelector('.item-card__name') as HTMLElement;
                    const imageElement = el.querySelector('.item-card__image') as HTMLImageElement;
                    const priceElement = el.querySelector('.item-card__prices-price') as HTMLElement;
                    return {
                        name: nameElement ? nameElement.innerText : '',
                        url: (el.querySelector('a') as HTMLAnchorElement)?.href || '',
                        image: imageElement ? imageElement.src : '',
                        category: category || "", 
                        price: priceElement ? priceElement.innerText : '',
                    };
                });
            }, category);
        };
    
        try {
            console.log('Starting to fetch products...');
            console.log(category);
    
            await retryRequest(page, url);
    
            let hasMorePages = true;
    
            while (hasMorePages) {
                const products = await fetchProductsFromPage(page);
                response.push(...products);
    
                const paginationButtons = await page.$$('.pagination__el');
                const lastButton = paginationButtons[paginationButtons.length - 1];
    
                if (lastButton && !await lastButton.evaluate(el => el.classList.contains('_disabled'))) {
                    console.log('Clicking next page...');
    
                    let clicked = false;
                    const maxRetries = 5;
                    let attempts = 0;
    
                    while (!clicked && attempts < maxRetries) {
                        attempts += 1;
    
                        await lastButton.click();
    
                        try {
                            await Promise.race([
                                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                                new Promise((resolve, reject) => setTimeout(reject, 5000)) 
                            ]);
    
                            clicked = true;
                        } catch (error) {
                            console.log(`Attempt ${attempts} failed. Retrying...`);
                        }
                    }
    
                    if (!clicked) {
                        console.error('Failed to navigate after 3 attempts.');
                    } else {
                        console.log('Navigation successful.');
                    }
    
                    console.log('Navigated to next page.');
                } else {
                    hasMorePages = false;
                    console.log('No more pages or pagination is disabled.');
                }
            }
    
            console.log(`Fetched ${response.length} products successfully.`);
        } catch (error) {
            console.error('Error fetching products:', error);
            await addToRedis(url);
            await page.reload()
        }
    
        return response;
    }
}
