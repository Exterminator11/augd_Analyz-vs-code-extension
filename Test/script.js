const javaCode = `
public class MyClass {
    public void myMethod() {
        // Method body
    }

    private int anotherMethod(String parameter) {
        // Method body
        return 42;
    }

    def hi(epoch = 10):
      print("Hello")
}
`;

const functionRegex = /(?:\b(?:void|int|String|boolean|char|float|double|long|short|byte|def)\b\s+(\w+)\s*\()/g;

let match;
while ((match = functionRegex.exec(javaCode)) !== null) {
    const functionName = match[1];
    console.log(`Found Java method: ${functionName}`);
}
