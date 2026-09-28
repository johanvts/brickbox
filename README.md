This is the output of publishing the lego-sorting/Web folder via parameters:
'dotnet publish -c Release -o release /p:WasmOptMethod=None /p:WasmCacheBootResources=false /p:BlazorCacheBootResources=false'

Further it is necessary to remove the integrity shas from index.html. IDK why these don't work but they break something currenly.
