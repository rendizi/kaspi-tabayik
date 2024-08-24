import { Page } from "puppeteer";
import { Product, Category, Subcategory, SubSubCategory } from "./types";

export class ScrapperService {
    async getCategories(page: Page): Promise<Category[]> {
        const response: Category[] = [];
        const maxRetries = 3; // Maximum number of retries
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

                        for (const subSubCategoryElement of subSubCategoriesElements) {
                            try {
                                console.log(`    Processing subsubcategory ${subSubCategoryIndex + 1}...`);
                                const subSubCategoryName = await page.evaluate((el: Element) => el.querySelector('.nav__sub-el-title')?.textContent?.trim() || '', subSubCategoryElement);
                                const subSubCategoryLink = await page.evaluate((el: Element) => (el.querySelector('.nav__sub-el-link') as HTMLAnchorElement)?.href || '', subSubCategoryElement);
                                console.log(`    Subsubcategory: ${subSubCategoryName}, Link: ${subSubCategoryLink}`);

                                const products: Product[] = [];

                                subsubcategories.push({
                                    name: subSubCategoryName,
                                    link: subSubCategoryLink,
                                    category: subCategoryName,
                                    products: products,
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
                break; // Remove this break if you want to continue iterating through other categories.
            }
        } catch (error) {
            console.error('Error extracting categories:', error);
        }

        return response;
    }

    async GetProducts(){
        
    }
}
