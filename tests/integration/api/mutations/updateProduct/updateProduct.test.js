import encodeOpaqueId from "@reactioncommerce/api-utils/encodeOpaqueId.js";
import importAsString from "@reactioncommerce/api-utils/importAsString.js";
import TestApp from "/tests/util/TestApp.js";

const updateProductMutation = importAsString("./updateProductMutation.graphql");
const updateProductVariantMutation = importAsString("./updateProductVariantMutation.graphql");

jest.setTimeout(300000);

const internalShopId = "123";
const internalProductId = "999";
const opaqueProductId = "cmVhY3Rpb24vcHJvZHVjdDo5OTk="; // reaction/product:999
const opaqueShopId = "cmVhY3Rpb24vc2hvcDoxMjM="; // reaction/shop:123
const internalVariantIds = ["875", "874", "925"];

const shopName = "Test Shop";

const mockProduct = {
  _id: internalProductId,
  ancestors: [],
  title: "Fake Product",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  supportedFulfillmentTypes: ["shipping"],
  type: "simple",
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockVariant = {
  _id: internalVariantIds[0],
  ancestors: [internalProductId],
  attributeLabel: "Variant",
  title: "Fake Product Variant",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

const mockOptionOne = {
  _id: internalVariantIds[1],
  ancestors: [internalProductId, internalVariantIds[0]],
  attributeLabel: "Option",
  title: "Fake Product Option One",
  shopId: internalShopId,
  isDeleted: false,
  isVisible: true,
  type: "variant"
};

let testApp;
let updateProduct;
let updateVariant;
beforeAll(async () => {
  testApp = new TestApp();
  await testApp.start();
  updateProduct = testApp.mutate(updateProductMutation);
  updateVariant = testApp.mutate(updateProductVariantMutation);
  await testApp.insertPrimaryShop({ _id: internalShopId, name: shopName });
  await testApp.collections.Products.insertOne(mockProduct);
  await testApp.collections.Products.insertOne(mockVariant);
  await testApp.collections.Products.insertOne(mockOptionOne);

  await testApp.setLoggedInUser({
    _id: "123",
    roles: { [internalShopId]: ["createProduct"] }
  });
});

afterAll(async () => {
  await testApp.collections.Shops.deleteOne({ _id: internalShopId });
  await testApp.collections.Products.deleteOne({ _id: internalProductId });
  await testApp.collections.Products.deleteOne({ _id: internalVariantIds[0] });
  await testApp.collections.Products.deleteOne({ _id: internalVariantIds[1] });
  await testApp.clearLoggedInUser();
  await testApp.stop();
});

// Update fields on a product
test("expect product fields to be updated", async () => {
  let result;

  const updateProductInput = {
    productId: opaqueProductId,
    shopId: opaqueShopId,
    product: {
      title: "Updated product title",
      metafields: [
        { key: "size", value: "small" },
        { key: "pattern", value: "striped" }
      ],
      twitterMsg: "Shop all new products"
    }
  };

  try {
    result = await updateProduct(updateProductInput);
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateProduct.product.title).toEqual("Updated product title");
  expect(result.updateProduct.product.metafields).toEqual([
    { key: "size", value: "small" },
    { key: "pattern", value: "striped" }
  ]);
  expect(result.updateProduct.product.socialMetadata).toEqual([
    {
      message: "",
      service: "facebook"
    },
    {
      message: "",
      service: "googleplus"
    },
    {
      message: "",
      service: "pinterest"
    },
    {
      message: "Shop all new products",
      service: "twitter"
    }
  ]);
});

test("expect product to be not visible", async () => {
  let result;

  const updateProductInput = {
    productId: opaqueProductId,
    shopId: opaqueShopId,
    product: {
      isVisible: false
    }
  };

  try {
    result = await updateProduct(updateProductInput);
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateProduct.product.isVisible).toEqual(false);
});

// Update a product variant
test("expect product variant fields to be updated", async () => {
  let result;

  const updateProductVariantInput = {
    variantId: encodeOpaqueId("reaction/product", internalVariantIds[0]),
    shopId: opaqueShopId,
    variant: {
      title: "Updated variant title",
      attributeLabel: "color",
      metafields: [
        { key: "size", value: "small" },
        { key: "pattern", value: "striped" }
      ]
    }
  };

  try {
    result = await updateVariant(updateProductVariantInput);
  } catch (error) {
    expect(error).toBeUndefined();
    return;
  }

  expect(result.updateProductVariant.variant.title).toEqual("Updated variant title");
  expect(result.updateProductVariant.variant.attributeLabel).toEqual("color");
  expect(result.updateProductVariant.variant.metafields).toEqual([
    { key: "size", value: "small" },
    { key: "pattern", value: "striped" }
  ]);
});