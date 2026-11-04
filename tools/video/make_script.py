import re,sys
s=open("장면표.md").read()
D=[("{천천히: ",""),("}",""),("케이, 엔, 엔.","kNN"),("케이디 트리","KD 트리"),("케이엔엔","kNN"),("일래스틱서치","Elasticsearch"),("애노이","Annoy"),("에벌린 픽스","Evelyn Fix"),("조지프 호지스","Joseph Hodges"),
   ("사과 6번","사과6"),("귤 4번","귤4"),("귤 6번","귤6"),("영 점 이팔","0.28"),("영 점 삼이","0.32"),("영 점 오사","0.54")]
def sub(t):
    for a,b in D: t=t.replace(a,b)
    t=re.sub(r'(?<![가-힣])케이(?=[가-힣 .,]|$)','k',t)
    t=re.sub(r'(?<![가-힣])에이(?=[는까의가와이,"])','A',t); t=re.sub(r'(?<![가-힣])비(?=[는까의라가와예])','B',t); t=re.sub(r'(?<![가-힣])씨(?=[는의라예,])','C',t)
    return t
out=["# kNN 알고리즘 영상 대본 (자막 표기)","","장면표.md의 읽기 줄을 자막 표기로 바꾼 것이에요. 괄호 안 시간은 1분 300자 기준 추정이에요.",""]
tot=0
for m in re.finditer(r'### (L\d+) · (.*?)\n\n- 읽기: (.*?)\n',s):
    sid,title,r=m.groups(); n=len(re.sub(r'\s','',r))
    out.append(f"**{sid} {title}** ({int(tot//60)}:{int(tot%60):02d})  \n{sub(r)}\n"); tot+=n/5
out.append(f"예상 길이: 약 {int(tot//60)}분 {int(tot%60)}초")
open("대본.md","w").write("\n".join(out)+"\n")
