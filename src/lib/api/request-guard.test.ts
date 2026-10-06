import { expect, it } from "vitest";
import { guardMutation } from "./request-guard";
it.each(["https://evil.example","null","http://localhost:3001","https://localhost:3000"])("rejects foreign origin %s before media type",async origin=>{
 const response=guardMutation(new Request("http://localhost:3000/api/me",{method:"DELETE",headers:{Origin:origin,"Content-Type":"text/plain"}}));
 expect(response?.status).toBe(403);expect(await response?.json()).toEqual({error:"Forbidden origin"});
});
it.each(["text/plain","application/x-www-form-urlencoded","multipart/form-data"])("rejects media type %s",async type=>{
 const response=guardMutation(new Request("http://localhost/api/me",{method:"POST",headers:{"Content-Type":type}}));
 expect(response?.status).toBe(415);expect(await response?.json()).toEqual({error:"Unsupported media type"});
});
it("allows bodyless delete, JSON parameters, missing origin and reads",()=>{
 expect(guardMutation(new Request("http://localhost/api/me",{method:"DELETE"}))).toBeNull();
 expect(guardMutation(new Request("http://localhost/api/me",{method:"PUT",headers:{Origin:"http://localhost","Content-Type":"application/json; charset=utf-8"}}))).toBeNull();
 expect(guardMutation(new Request("http://localhost/api/me",{headers:{Origin:"null"}}))).toBeNull();
});
