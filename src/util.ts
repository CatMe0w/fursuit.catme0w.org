export const currentUrl = new URL(location.href);
export const currentParams = new URLSearchParams(currentUrl.search);
export const timeParam = currentParams.get("time");

export function makeNewUrl(params: URLSearchParams) {
  if (params.toString())
    return currentUrl.origin + currentUrl.pathname + "?" + params.toString();
  else
    return currentUrl.origin + currentUrl.pathname;
}