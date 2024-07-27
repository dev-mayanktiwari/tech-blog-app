export default async function hashPassword(password: string) {
    const encodedPassword = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2,"0")).join("");

    return hashHex;
} 